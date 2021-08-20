import cp, { ChildProcess } from 'child_process';
import execa from 'execa';
import _ from 'lodash';
import PCancelable from 'p-cancelable';
import { v4 as generateUuid } from 'uuid';
import { getEnvs } from '../config';
import { getWorkflowInstalledPath } from '../config/path';
import { ActionFlowManager } from './actionFlowManager';

type ScriptExecuterOption = {
  all?: boolean;
  timeout?: number;
  shell?: boolean | string;
};

let scriptExecutor: ChildProcess;
let useExecutorProcess: boolean = false;

/**
 * Should call startScriptExecutor to start executor process before call 'excute'
 * Bind 'arvis-core/scripts/scriptExecutor.js' file's path to executorFilePath
 */
export const startScriptExecutor = (executorFilePath: string): ChildProcess => {
  scriptExecutor = cp.fork(executorFilePath);

  const printExitWarning = () => console.warn('scriptExecutor\'s ipc channel was closed. It might be error unless arvis is supposed to be quited.');

  scriptExecutor.on('close', () => {
    printExitWarning();
  });

  scriptExecutor.on('exit', () => {
    printExitWarning();
  });

  scriptExecutor.on('disconnect', () => {
    printExitWarning();
  });

  scriptExecutor.on('error', (err) => {
    console.error('ScriptExecutor Error', err);
  });

  return scriptExecutor;
};

/**
 * Should call endScriptExecutor before quit arvis
 */
export const endScriptExecutor = () => {
  if (scriptExecutor) {
    scriptExecutor.kill();
  }
};

/**
 */
export const setUseExecutorProcess = (arg: boolean) => {
  useExecutorProcess = arg;
};

/**
 * Make unique identifier
 */
const generateRequestId = () => {
  return generateUuid();
};

/**
 * @param bundleId
 * @param scriptStr
 * @param vars
 * @param options?
 * @returns Cancelable promise returning executed process's return value
 */
export const execute = ({
  bundleId,
  scriptStr,
  vars,
  options
}: {
  bundleId: string;
  scriptStr: string;
  vars: Record<string, any>;
  options?: ScriptExecuterOption | undefined;
}): PCancelable<execa.ExecaReturnValue<string>> => {
  const { execPath, name, version, type } =
    ActionFlowManager.getInstance().extensionInfo!;

  let all: boolean | undefined;
  let timeout: number | undefined;
  let shell: string | boolean | undefined;

  if (options) {
    all = options.all;
    timeout = options.timeout;
    shell = options.shell;
  }

  // 100MB
  const maxBuffer = 100000000;

  const executorOptions = {
    all,
    buffer: true,
    cleanup: true,
    // Assume workflow's hotkey script execution if execPath not exist
    cwd: execPath ?? getWorkflowInstalledPath(bundleId),
    encoding: 'utf8',
    extendEnv: true,
    killSignal: 'SIGTERM',
    maxBuffer,
    preferLocal: false,
    shell,
    timeout,
    windowsHide: true,
    env: getEnvs({
      extensionType: type,
      bundleId,
      name: name ?? '',
      version: version ?? '',
      vars: vars ?? {},
    }),
  };

  const requestId = generateRequestId();

  if (!useExecutorProcess) {
    return new PCancelable<execa.ExecaReturnValue<string>>((resolve, reject, onCancel) => {
      const proc = execa.command(scriptStr, executorOptions);
      proc.then(resolve).catch(reject);

      onCancel(() => {
        proc.cancel();
      });
    });
  } else {
    if (!scriptExecutor) {
      throw new Error('execute should not be called before scriptExecutor process starts.');
    }

    // If it doesn't finish within the timeout time, an error is considered to have occurred.
    // Timeout time to should be changed.
    scriptExecutor.send({ id: requestId, event: 'execute', scriptStr, executorOptions: JSON.stringify(executorOptions) });

    return new PCancelable<execa.ExecaReturnValue<string>>((resolve, reject, onCancel) => {
      // Remove previous 'canceled' message event listenrers
      scriptExecutor.removeAllListeners();

      scriptExecutor.on('message', ({ id, payload }: { id: string; payload: string }) => {
        if (id !== requestId) return;

        const result: execa.ExecaReturnValue<string> | Error = JSON.parse(payload);

        if (_.isError(result)) {
          reject(result);
        } else {
          resolve(result);
        }
      });

      onCancel(() => {
        scriptExecutor.send({ id: requestId, event: 'cancel' });
      });
    });
  }
};