import {
  getExtensionCachePath,
  getExtensionDataPath,
  getExtensionHistoryPath,
} from './path';

const extractVarEnv = (queryArgs: object) => {
  const vars = {};

  Object.keys(queryArgs)
    .filter((arg: string) => arg.startsWith('{var:') && arg.endsWith('}'))
    .map((arg: string) => arg.substring(5, arg.length - 1))
    .forEach((key) => {
      vars[key] = queryArgs[`{var:${key}}`];
    });

  return vars;
};

const getEnvs = ({
  extensionType,
  bundleId,
  vars,
  name,
  version,
}: {
  extensionType: 'workflow' | 'plugin',
  bundleId: string;
  vars: object;
  name?: string;
  version?: string;
}) => {
  const env = {
    arvis_version: 'demo',
    arvis_extension_version: name ?? '',
    arvis_extension_name: version ?? '',
    arvis_extension_bundleid: bundleId,
    arvis_extension_type: extensionType,
    arvis_extension_data: getExtensionDataPath(bundleId),
    arvis_extension_cache: getExtensionCachePath(bundleId),
    arvis_extension_history: getExtensionHistoryPath(),
  };

  // Environment variable setting for alfred workflows
  const alfredWorkflowEnv = {
    alfred_workflow_bundleid: env.arvis_extension_bundleid,
    alfred_workflow_cache: env.arvis_extension_cache,
    alfred_workflow_data: env.arvis_extension_data,
    alfred_workflow_name: bundleId,
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

  return {
    ...vars,
    ...env,
    ...alfredWorkflowEnv,
  };
};

export { getEnvs, extractVarEnv };
