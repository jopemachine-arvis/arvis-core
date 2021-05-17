import path from 'path';
import { getPluginInstalledPath } from '../config/path';
import { getPluginList } from './pluginList';

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

  /**
   * @param  {any[]} pluginInfos
   */
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

  /**
   * @param  {string} inputStr
   */
  search: (inputStr: string) => {
    let pluginOutputItems: any[] = [];
    for (const pluginBundleId of Object.keys(pluginWorkspace.pluginModules)) {
      const pluginModule = pluginWorkspace.pluginModules[pluginBundleId];
      try {
        const thisPluginOutputItems = (pluginModule as any)(inputStr).items;
        thisPluginOutputItems.forEach((item) => item.bundleId = pluginBundleId);

        pluginOutputItems = [
          ...pluginOutputItems,
          ...thisPluginOutputItems,
        ];
      } catch (err) {
        console.error(
          `Plugin '${pluginBundleId}' raised error on execution: \n${err}`
        );
      }
    }

    pluginOutputItems.forEach((item) => {
      item.isPluginItem = true;
      item.type = 'keyword';
      item.command = item.title;
      item.action = getPluginList()[item.bundleId].action;
    });
    return pluginOutputItems;
  },
};

export default pluginWorkspace;

export { pluginWorkspace };
