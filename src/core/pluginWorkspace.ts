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
  renew: (pluginInfos: any[]) => {
    const newPluginModules = {};
    for (const pluginInfo of pluginInfos) {
      const modulePath = path.normalize(
        `${getPluginInstalledPath(pluginInfo.bundleId)}${path.sep}${
          pluginInfo.main
        }`
      );

      try {
        newPluginModules[pluginInfo.bundleId] = requireDynamically(modulePath);
      } catch (err) {
        console.error(
          `Plugin '${pluginInfo.bundleId}' raised error on require: \n${err}`
        );
      }
    }

    pluginWorkspace.pluginModules = newPluginModules;
    console.log('Updated pluginModules', pluginWorkspace.pluginModules);
  },

  /**
   * @param  {string} inputStr
   */
  search: async (inputStr: string) => {
    let pluginOutputItems: any[] = [];
    // const pluginPromises: object = {};
    const pluginPromises: Promise<any>[] = [];

    for (const pluginBundleId of Object.keys(pluginWorkspace.pluginModules)) {
      const pluginModule = pluginWorkspace.pluginModules[pluginBundleId];
      try {
        const pluginExecutionResult = (pluginModule as any)(inputStr);

        if (pluginExecutionResult.then) {
          pluginPromises.push(
            new Promise<any>((resolve, reject) => {
              pluginExecutionResult
                .then((result) => {
                  if (!result.items || !result.items.length) resolve([]);

                  resolve(
                    result.items.map((item) => {
                      item.bundleId = pluginBundleId;
                      return item;
                    })
                  );
                })
                .catch(reject);
            })
          );
        } else {
          const thisPluginOutputItems = (pluginModule as any)(inputStr).items;
          thisPluginOutputItems.forEach(
            (item) => (item.bundleId = pluginBundleId)
          );

          pluginOutputItems = [...pluginOutputItems, ...thisPluginOutputItems];
        }
      } catch (err) {
        console.error(
          `Plugin '${pluginBundleId}' raised error on execution: \n${err}`
        );
      }
    }

    try {
      pluginOutputItems = [
        ...pluginOutputItems,
        ...((await Promise.all(pluginPromises))[0]),
      ];
    } catch (err) {
      // skip async items
      console.error('Async print error', err);
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
