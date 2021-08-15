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

/**
 * Should call startScriptExecutor to start executor process before call excute
 * Forward 'arvis-core/scripts/scriptExecutor.js' file's path to executorFilePath
 */
export const startScriptExecutor = async (executorFilePath: string) => {
  scriptExecutor = cp.fork(executorFilePath);
  return scriptExecutor;
};

/**
 * Should call endScriptExecutor before quit arvis
 */
export const endScriptExecutor = async () => {
  if (scriptExecutor) {
    scriptExecutor.kill();
  }
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
  if (!scriptExecutor) {
    throw new Error('execute should not be called before scriptExecutor process starts.');
  }

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

  const executorOptions = JSON.stringify({
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
    serialization: 'json',
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
  });

  const requestId = generateRequestId();
  scriptExecutor.send({ id: requestId, event: 'execute', scriptStr, executorOptions });

  return new PCancelable<execa.ExecaReturnValue<string>>((resolve, reject, onCancel) => {
    // Remove previous 'canceled' message event listenrers
    scriptExecutor.removeAllListeners();

    scriptExecutor.on('message', ({ id, payload }: { id: string; payload: string }) => {
      if (id !== requestId) return;

      const result: execa.ExecaReturnValue<string> = JSON.parse(payload);

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
};