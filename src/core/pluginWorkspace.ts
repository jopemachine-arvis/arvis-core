import path from 'path';
import { getPluginInstalledPath } from '../config/path';

/**
 * @param  {string} modulePath
 */
const requireDynamically = (modulePath: string) => {
  modulePath = modulePath.split('\\').join('/');
  // tslint:disable-next-line: no-eval
  return eval(`require('${modulePath}');`);
};

const pluginWorkspace = {
  pluginModules: {},

  renew: async (pluginInfos: any[]) => {
    for (const pluginInfo of pluginInfos) {
      const modulePath = path.normalize(
        `${getPluginInstalledPath(pluginInfo.bundleId)}${path.sep}${
          pluginInfo.main
        }`
      );

      try {
        pluginWorkspace.pluginModules[pluginInfo.bundleId] =
          requireDynamically(modulePath);
      } catch (err) {
        console.error(
          `Plugin '${pluginInfo.bundleId}' raised error on require: \n${err}`
        );
      }
    }
    console.log('Updated pluginModules', pluginWorkspace.pluginModules);
  },

  search: (inputStr: string) => {
    let pluginOutputItems: any[] = [];
    for (const pluginBundleId of Object.keys(pluginWorkspace.pluginModules)) {
      const pluginModule = pluginWorkspace.pluginModules[pluginBundleId];
      try {
        pluginOutputItems = [
          ...pluginOutputItems,
          ...(pluginModule as any)(inputStr).items,
        ];
      } catch (err) {
        console.error(
          `Plugin '${pluginBundleId}' raised error on execution: \n${err}`
        );
      }
    }
    return pluginOutputItems;
  },
};

export default pluginWorkspace;

export { pluginWorkspace };
