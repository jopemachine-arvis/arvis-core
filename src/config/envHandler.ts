import {
  getExtensionCachePath,
  getExtensionDataPath,
  getExtensionHistoryPath,
} from './path';

let macPathsEnv: string = '';
let externalEnv: Record<string, any> = {};

/**
 * @param  {string} path
 * @description Because mac gui apps doesn't inherit PATH env, need to set it manually
 */
export const setMacPathsEnv = (path: string): void => {
  macPathsEnv = path;
};

/**
 * @returns  {string} $PATH value
 * @description Before call getMacPaths, should call setMacPathsEnv.
 */
export const getMacPathsEnv = (): string => {
  return macPathsEnv;
};

/**
 * @param  {string} path
 * @description Sets environment variables outside core lib
 */
export const setExternalEnvs = (envs: Record<string, any>): void => {
  externalEnv = envs;
};

/**
 * @description Gets environment variables outside core lib
 */
export const getExternalEnvs = (): Record<string, any> => {
  return externalEnv;
};

/**
 * @param  {Record<string, any>} queryArgs
 */
export const extractVarEnv = (queryArgs: Record<string, any>): Record<string, any> => {
  const vars = {};

  Object.keys(queryArgs)
    .filter((arg: string) => arg.startsWith('{var:') && arg.endsWith('}'))
    .map((arg: string) => arg.substring(5, arg.length - 1))
    .forEach((key) => {
      vars[key] = queryArgs[`{var:${key}}`];
    });

  return vars;
};

/**
 * @param  {string;vars:Record<string, any>;name?:string;version?:string;}
 * @returns
 */
export const getEnvs = ({
  extensionType,
  bundleId,
  vars,
  name,
  version,
}: {
  extensionType: 'workflow' | 'plugin';
  bundleId: string;
  vars: Record<string, any>;
  name?: string;
  version?: string;
}): any => {
  const env = {
    arvis_extension_bundleid: bundleId,
    arvis_extension_cache: getExtensionCachePath(bundleId),
    arvis_extension_data: getExtensionDataPath(bundleId),
    arvis_extension_history: getExtensionHistoryPath(),
    arvis_extension_name: name ?? '',
    arvis_extension_type: extensionType,
    arvis_extension_version: version ?? '',
  };

  // In macos, GUI App does not inherit $PATH.
  // So need to provide path directly
  if (process.platform === 'darwin') {
    env['PATH'] = macPathsEnv;
  }

  // Environment variable setting for alfred workflows
  const alfredWorkflowEnv = {
    alfred_workflow_bundleid: env.arvis_extension_bundleid,
    alfred_workflow_cache: env.arvis_extension_cache,
    alfred_workflow_data: env.arvis_extension_data,
    alfred_workflow_name: name ?? '',
    alfred_workflow_uid: bundleId,

    // mock data
    alfred_debug: '0',
    alfred_preferences:
      '/Users/Crayons/Dropbox/Alfred/Alfred.alfredpreferences',
    alfred_preferences_localhash: 'adbd4f66bc3ae8493832af61a41ee609b20d8705',
    alfred_theme: 'alfred.theme.yosemite',
    alfred_theme_background: 'rgba(255,255,255,0.98)',
    alfred_theme_subtext: '3',
    alfred_version: '2.4',
    alfred_version_build: '277',
  };

  const transformedVars = { ...vars };
  for (const variable of Object.keys(vars)) {
    transformedVars[variable] = JSON.stringify(vars[variable]);
  }

  return {
    ...transformedVars,
    ...env,
    ...alfredWorkflowEnv,
    ...externalEnv,
  };
};
