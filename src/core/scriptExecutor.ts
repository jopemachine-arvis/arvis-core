import execa from 'execa';
import _ from 'lodash';
import { getEnvs } from '../config';
import { getWorkflowInstalledPath } from '../config/path';
import { ActionFlowManager } from './actionFlowManager';

type ScriptExecuterOption = {
  all?: boolean;
  timeout?: number;
  shell?: boolean | string;
};

/**
 * @param  {string} bundleId
 * @param  {string} scriptStr
 * @param  {Record<string, any>} vars
 * @param  {ScriptExecuterOption} options?
 * @returns {execa.ExecaChildProcess<string>} Executed process
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
}): execa.ExecaChildProcess<string> => {
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
      vars: vars ?? {},
    }),
  });
};
