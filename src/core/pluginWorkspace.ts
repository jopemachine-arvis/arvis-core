// tslint:disable: no-eval
import _ from 'lodash';
import path from 'path';
import { getEnvs, getHistory, log, LogType } from '../config';
import { trace } from '../config/logger';
import { getPluginInstalledPath } from '../config/path';
import { getPluginList } from './pluginList';
import { WorkManager } from './workManager';

/**
 * @param  {string} modulePath
 * @summary Remove cache from existing module for module updates, and dynamically require new modules.
 *          Use eval.
 */
const requireDynamically = (modulePath: string, envs: object = {}): any => {
  modulePath = modulePath.split('\\').join('/');

  try {
    const moduleCache = eval(`
      require.cache[require.resolve('${modulePath}')];
    `);

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

  return eval(`
    const envs = JSON.parse('${JSON.stringify(envs)}');

    Object.keys(envs).forEach(function(env) {
      process.env[env] = envs[env];
    });

    require('${modulePath}');
  `);
};

const pluginWorkspace = {
  pluginModules: {},

  /**
   * @param  {any[]} pluginInfos
   */
  renew: (pluginInfos: any[], bundleId?: string): void => {
    const newPluginModules = bundleId ? pluginWorkspace.pluginModules : {};

    for (const pluginInfo of pluginInfos) {
      const modulePath = path.normalize(
        `${getPluginInstalledPath(pluginInfo.bundleId)}${path.sep}${
          pluginInfo.main
        }`
      );

      try {
        const envs = getEnvs({ bundleId: pluginInfo.bundleId });
        newPluginModules[pluginInfo.bundleId] = requireDynamically(
          modulePath,
          envs
        );
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
  search: async (inputStr: string): Promise<PluginItem[]> => {
    let pluginOutputItems: any[] = [];
    const asyncPluginWorks: Promise<any>[] = [];

    for (const pluginBundleId of Object.keys(pluginWorkspace.pluginModules)) {
      if (!getPluginList()[pluginBundleId].enabled) continue;
      const pluginModule = pluginWorkspace.pluginModules[pluginBundleId];

      try {
        const pluginExecutionResult = (pluginModule as Function)({
          inputStr,
          history: getHistory(),
        });

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
          const thisPluginOutputItems = (pluginModule as Function)({
            inputStr,
            history: getHistory(),
          }).items;

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

    const asyncPluginResults = await Promise.allSettled(asyncPluginWorks);

    const successes = asyncPluginResults
      .filter((result) => result.status === 'fulfilled')
      .map((item) => (item as any).value);

    const errors = asyncPluginResults
      .filter((result) => result.status === 'rejected')
      .map((item) => (item as any).reason);

    const asyncPrintResult = _.flattenDeep(successes);

    pluginOutputItems = [...pluginOutputItems, ...asyncPrintResult]
      .filter((item) => item !== null && item !== undefined)
      .map((item) => {
        item.isPluginItem = true;
        // pluginItem is treated like keyword
        item.type = 'keyword';
        item.command = item.title;
        item.action = getPluginList()[item.bundleId].action;
        return item;
      });

    if (WorkManager.getInstance().printPluginItems) {
      log(LogType.info, 'Plugin Items: ', pluginOutputItems);
    }

    if (errors.length !== 0) {
      for (const error of errors) {
        log(LogType.error, 'Async plugin runtime errors occur\n', error);
      }
    }

    return pluginOutputItems;
  },
};

export default pluginWorkspace;

export { pluginWorkspace };
