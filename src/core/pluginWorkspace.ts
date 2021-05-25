// tslint:disable: no-eval
import _ from 'lodash';
import path from 'path';
import { log, LogType } from '../config';
import { trace } from '../config/logger';
import { getPluginInstalledPath } from '../config/path';
import { getPluginList } from './pluginList';

/**
 * @param  {string} modulePath
 * @summary Remove cache from existing module for module updates, and dynamically require new modules.
 *          Use eval.
 */
const requireDynamically = (modulePath: string) => {
  modulePath = modulePath.split('\\').join('/');

  try {
    const moduleCache = eval(`require.cache[require.resolve('${modulePath}')]`);

    if (moduleCache) {
      eval(`
        Object.keys(require.cache).forEach(function(key) {
          delete require.cache[key];
        });
      `);
    }
  } catch (err) {
    log(LogType.debug, 'Plugin module cache not deleted', err);
  }

  return eval(`require('${modulePath}');`);
};

const pluginWorkspace = {
  pluginModules: {},

  /**
   * @param  {any[]} pluginInfos
   */
  renew: (pluginInfos: any[], bundleId?: string) => {
    const newPluginModules = bundleId ? pluginWorkspace.pluginModules : {};

    for (const pluginInfo of pluginInfos) {
      const modulePath = path.normalize(
        `${getPluginInstalledPath(pluginInfo.bundleId)}${path.sep}${
          pluginInfo.main
        }`
      );

      try {
        newPluginModules[pluginInfo.bundleId] = requireDynamically(modulePath);
      } catch (err) {
        log(
          LogType.error,
          `Plugin '${pluginInfo.bundleId}' raised error on require: \n${err}`
        );

        trace(err);
      }
    }

    pluginWorkspace.pluginModules = newPluginModules;
    log(LogType.debug, 'Updated pluginModules', pluginWorkspace.pluginModules);
  },

  /**
   * @param  {string} inputStr
   */
  search: async (inputStr: string) => {
    let pluginOutputItems: any[] = [];
    const asyncPluginWorks: Promise<any>[] = [];

    for (const pluginBundleId of Object.keys(pluginWorkspace.pluginModules)) {
      const pluginModule = pluginWorkspace.pluginModules[pluginBundleId];
      try {
        const pluginExecutionResult = (pluginModule as any)(inputStr);

        if (pluginExecutionResult.then) {
          asyncPluginWorks.push(
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
        log(
          LogType.error,
          `Plugin '${pluginBundleId}' raised error on execution: \n${err}`
        );
      }
    }

    try {
      pluginOutputItems = [
        ...pluginOutputItems,
        ..._.flattenDeep(await Promise.all(asyncPluginWorks)),
      ];
    } catch (err) {
      // skip async items on errors
      log(LogType.error, 'Async print error', err);
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
