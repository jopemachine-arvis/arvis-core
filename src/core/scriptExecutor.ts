import execa from 'execa';
import _ from 'lodash';
import { getEnvs } from '../config';
import { getWorkflowInstalledPath } from '../config/path';
import { WorkManager } from './workManager';

type ScriptExecuterOption = {
  all?: boolean;
  timeout?: number;
  shell?: boolean | string;
};

/**
 * @param  {string} bundleId
 * @param  {string} scriptStr
 * @param  {ScriptExecuterOption} options?
 * @return {execa.ExecaChildProcess<string>} Executed process
 */
const execute = ({
  bundleId,
  scriptStr,
  vars,
  options
}: {
  bundleId: string;
  scriptStr: string;
  vars: object;
  options?: ScriptExecuterOption | undefined;
}): execa.ExecaChildProcess<string> => {
  const { execPath, name, version, type } =
    WorkManager.getInstance().extensionInfo!;

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

  // If it doesn't finish within the timeout time, an error is considered to have occurred.
  // Timeout time to should be changed.
  return execa.command(scriptStr, {
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
      vars,
    }),
  });
};

export { execute };
