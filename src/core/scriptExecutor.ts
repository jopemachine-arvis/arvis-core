import execa from 'execa';
import _ from 'lodash';
import PCancelable from 'p-cancelable';
import { v4 as generateUuid } from 'uuid';
import { getEnvs, log, LogType } from '../config';
import { getShellPathsEnv } from '../config/envHandler';
import { getWorkflowInstalledPath } from '../config/path';
import { ActionFlowManager } from './actionFlowManager';
const scriptExecutorProcess = require('../../assets/scriptExecutor.json').scriptExecutor;

type ScriptExecuterOption = {
  all?: boolean;
  timeout?: number;
  shell?: boolean | string;
};

let scriptExecutor: execa.ExecaChildProcess<string>;
let useExecutorProcess: boolean = false;

/**
 * Should call startScriptExecutor to start executor process before call 'excute'
 * Bind 'arvis-core/scripts/scriptExecutor.js' file's path to executorFilePath
 */
export const startScriptExecutor = (modulePath: { execa: string }): execa.ExecaChildProcess<string> => {
  const env = process.env;
  if (process.platform !== 'win32') {
    env['PATH'] = getShellPathsEnv();
  }

  scriptExecutor = execa('node', ['--eval', scriptExecutorProcess, modulePath.execa], {
    env,
    all: true,
    stdio: ['ipc'],
    detached: true,
    extendEnv: true,
    encoding: 'utf8',
  });

  scriptExecutor.on('exit', (exitCode) => {
    log(LogType.warn, 'ScriptExecutor\'s ipc channel was closed. It might be error unless arvis is supposed to be quited.\nExit code: ' + exitCode);
  });

  scriptExecutor.on('error', (err) => {
    log(LogType.error, 'ScriptExecutor Error', err);
  });

  scriptExecutor.all!.pipe(process.stdout);

  return scriptExecutor;
};

/**
 * Should call endScriptExecutor before quit arvis
 */
export const endScriptExecutor = (): void => {
  if (scriptExecutor) {
    scriptExecutor.kill();
  }
};

/**
 */
export const setUseExecutorProcess = (arg: boolean): void => {
  useExecutorProcess = arg;
};

/**
 * Make unique identifier
 */
const generateRequestId = (): string => {
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

  if (useExecutorProcess && scriptExecutor && scriptExecutor.connected) {
    const requestId = generateRequestId();
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
  } else {
    console.warn('ScriptExecutor not executed or ipc channel was closed due to error. This can cause performance down in scriptfilter');

    return new PCancelable<execa.ExecaReturnValue<string>>((resolve, reject, onCancel) => {
      const proc = execa.command(scriptStr, executorOptions);
      proc.then(resolve).catch(reject);

      onCancel(() => {
        proc.cancel();
      });
    });
  }
};