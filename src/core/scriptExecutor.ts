import execa from 'execa';
import _ from 'lodash';
import PCancelable from 'p-cancelable';
import { v4 as generateUuid } from 'uuid';
import { getEnvs, log, LogType } from '../config';
import { getMacPathsEnv } from '../config/envHandler';
import { getWorkflowInstalledPath } from '../config/path';
import { ActionFlowManager } from './actionFlowManager';

type ScriptExecuterOption = {
  all?: boolean;
  timeout?: number;
  shell?: boolean | string;
};

let scriptExecutor: execa.ExecaChildProcess<string>;
let useExecutorProcess: boolean = false;

const scriptExecutorProcess = `
const execa = require(process.argv[1]);

let executionTimer;

// Wait a little longer than child process spawning will normally uses (around 15ms).
const executionDelay = 25;

const requests = new Map();

const addRequest = (id, proc) => {
  requests.set(id, proc);
};

const cancelProc = (id) => {
  if (requests.has(id)) {
    requests.get(id).cancel();
  }
};

const clearExecutionTimer = () => {
  if (executionTimer) {
    clearTimeout(executionTimer);
  }
};

const handleExecute = (id, scriptStr, executorOptions) => {
  let payload;

  // Clear previous script execution timer.
  clearExecutionTimer();

  const handler = () => {
    clearExecutionTimer();

    const proc = execa.command(scriptStr, executorOptions);
    addRequest(id, proc);

    return proc.then((result) => {
      payload = result;
      return result;
    }).catch((err) => {
      payload = err;
    }).finally(() => {
      requests.delete(id);
      process.send({ id, payload: JSON.stringify(payload) });
    });
  };

  executionTimer = setTimeout(handler, executionDelay);
};

process.on('message', async ({ id, event, scriptStr, executorOptions }) => {
  switch (event) {
    case 'execute':
      handleExecute(id, scriptStr, JSON.parse(executorOptions));
      break;

    case 'cancel':
      cancelProc(id);
      break;

    default:
      console.error('Unsupported event type ' + event);
      break;
  }
});
`;

/**
 * Should call startScriptExecutor to start executor process before call 'excute'
 * Bind 'arvis-core/scripts/scriptExecutor.js' file's path to executorFilePath
 */
export const startScriptExecutor = (modulePath: { execa: string }): execa.ExecaChildProcess<string> => {
  const env = process.env;
  if (process.platform === 'darwin') {
    env['PATH'] = getMacPathsEnv();
  }

  scriptExecutor = execa('node', ['--eval', scriptExecutorProcess, modulePath.execa], { stdio: ['ipc'], detached: true, extendEnv: true, env, encoding: 'utf8' });

  scriptExecutor.on('exit', (exitCode) => {
    log(LogType.warn, 'scriptExecutor\'s ipc channel was closed. It might be error unless arvis is supposed to be quited.\nexit code: ' + exitCode);
  });

  scriptExecutor.on('error', (err) => {
    log(LogType.error, 'ScriptExecutor Error', err);
  });

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