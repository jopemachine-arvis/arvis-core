import _ from 'lodash';
import execa from '../../execa';
import { getEnvs } from '../config';
import { getWorkflowInstalledPath } from '../config/path';
import { WorkManager } from './workManager';

type ScriptExecuterOption = {
  all?: boolean;
  timeout?: number;
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
  options,
}: {
  bundleId: string;
  scriptStr: string;
  options?: ScriptExecuterOption;
}): execa.ExecaChildProcess<string> => {
  const { execPath, name, version, type } =
    WorkManager.getInstance().extensionInfo!;

  let all;
  let timeout;

  if (options) {
    all = options.all;
    timeout = options.timeout;
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
    shell: false,
    timeout,
    windowsHide: true,
    env: getEnvs({
      extensionType: type,
      bundleId,
      name: name ?? '',
      version: version ?? '',
    }),
  });
};

export { execute };
