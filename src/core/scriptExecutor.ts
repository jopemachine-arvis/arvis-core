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
    arvis_workflow_data: getWorkflowDataPath(bundleId),
    arvis_workflow_cache: getWorkflowCachePath(bundleId),
  };

  // Environment variable setting for alfred workflows
  const alfredWorkflowEnv = {
    alfred_workflow_bundleid: bundleId,
    alfred_workflow_cache: env.arvis_workflow_cache,
    alfred_workflow_data: env.arvis_workflow_data,
    alfred_workflow_name: bundleId,
    alfred_workflow_uid: bundleId,

    // mock data
    alfred_debug: '0',
    alfred_preferences: '/Users/Crayons/Dropbox/Alfred/Alfred.alfredpreferences',
    alfred_preferences_localhash: 'adbd4f66bc3ae8493832af61a41ee609b20d8705',
    alfred_theme: 'alfred.theme.yosemite',
    alfred_theme_background: 'rgba(255,255,255,0.98)',
    alfred_theme_subtext: '3',
    alfred_version: '2.4',
    alfred_version_build: '277',
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