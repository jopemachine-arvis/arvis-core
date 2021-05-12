import _ from 'lodash';
import path from 'path';
import execa from '../../execa';
import {
  getWorkflowCachePath,
  getWorkflowDataPath,
  getWorkflowInstalledPath,
} from '../config/path';

type ScriptExecuterOption = {
  all?: boolean;
  timeout?: number;
};

/**
 * @param  {string} bundleId
 * @param  {string} scriptStr
 * @param  {ScriptExecuterOption} options?
 * @return {execa.ExecaChildProcess<string>} executed process
 */
const execute = (
  bundleId: string,
  scriptStr: string,
  options?: ScriptExecuterOption
) => {
  const execPath = path.resolve(getWorkflowInstalledPath(bundleId));

  let all;
  let timeout;

  if (options) {
    all = options.all;
    timeout = options.timeout;
  }

  const env = {

  };
  const alfredWorkflowEnv = {
    // Environment variable setting for alfred workflows
    alfred_debug: '1',
    alfred_version: '4.3.4',
    alfred_workflow_data: getWorkflowDataPath(bundleId),
    alfred_workflow_cache: getWorkflowCachePath(bundleId),
  };

  // 100MB
  const maxBuffer = 100000000;

  // If it doesn't finish within the timeout time, an error is considered to have occurred.
  // Timeout time to should be changed.
  return execa.command(scriptStr, {
    all,
    buffer: true,
    cleanup: true,
    cwd: execPath,
    encoding: 'utf8',
    extendEnv: true,
    killSignal: 'SIGTERM',
    maxBuffer,
    preferLocal: false,
    serialization: 'json',
    shell: false,
    timeout,
    windowsHide: true,
    env: {
      ...env,
      ...alfredWorkflowEnv
    },
  });
};

export {
  execute,
};