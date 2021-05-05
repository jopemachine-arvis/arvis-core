import execa from 'execa';
import _ from 'lodash';
import path from 'path';

import { workflowInstallPath } from '../config/path';

type ScriptExecuterOption = {
  all?: boolean;
  timeout?: number;
};

const execute = (
  bundleId: string,
  scriptStr: string,
  options?: ScriptExecuterOption
) => {
  const execPath = path.resolve(
    `${workflowInstallPath}${path.sep}installed${path.sep}${bundleId}`
  );

  let all;
  let timeout;

  if (options) {
    all = options.all;
    timeout = options.timeout;
  }

  const env = {
    // Environment variable setting for 'alfy' compatibility
    alfred_workflow_cache: bundleId,
  };

  // If it doesn't finish within the timeout time, an error is considered to have occurred.
  // Timeout time to should be changed.
  return execa.command(scriptStr, {
    all,
    buffer: true,
    cleanup: true,
    cwd: execPath,
    encoding: 'utf8',
    env,
    extendEnv: true,
    killSignal: 'SIGTERM',
    maxBuffer: 100000000,
    preferLocal: false,
    serialization: 'json',
    shell: false,
    timeout,
    windowsHide: true,
  });
};

export {
  execute,
};