// tslint:disable: no-eval
import _ from 'lodash';
import PCancelable from 'p-cancelable';
import path from 'path';
import { compareTwoStrings } from 'string-similarity';
import { getEnvs, getHistory, log, LogType } from '../config';
import { trace } from '../config/logger';
import { getPluginInstalledPath } from '../config/path';
import { PluginExectionResult } from '../types/pluginExectionResult';
import { getPluginList } from './pluginList';
import { WorkManager } from './workManager';

/**
 * @param  {string} modulePath
 * @summary Remove cache from existing module for module updates,
 *          Add environment variables,
 *          And dynamically require new modules using eval.
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

  // For windows support
  const envsStr = JSON.stringify(envs).split(path.sep).join('/');

  return eval(`
    const envs = JSON.parse('${envsStr}');

    Object.keys(envs).forEach(function(env) {
      process.env[env] = envs[env];
    });

    require('${modulePath}');
  `);
};

interface PluginWorkspace {
  pluginModules: object;
  asyncWorks: PCancelable<any>[];
  asyncPluginTimer: number;
  setAsyncPluginTimer: (timer: number) => void;
  getAsyncWork: (
    pluginBundleId: string,
    asyncPluginPromise: Promise<any>
  ) => PCancelable<any>;
  renew: (pluginInfos: any[], bundleId?: string) => void;
  search: (inputStr: string) => Promise<PluginExectionResult[]>;
  cancelPrevious: () => void;
}

const pluginWorkspace: PluginWorkspace = {
  pluginModules: {},

  asyncWorks: [],

  asyncPluginTimer: 100,

  setAsyncPluginTimer: (timer: number): void => {
    pluginWorkspace.asyncPluginTimer = timer;
  },

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
        const envs = getEnvs({
          extensionType: 'plugin',
          bundleId: pluginInfo.bundleId,
          name: pluginInfo.name,
          version: pluginInfo.version,
          vars: pluginInfo.variables
        });

        newPluginModules[pluginInfo.bundleId] = requireDynamically(
          modulePath,
          envs
        );
      } catch (err) {
        log(
          LogType.error,
          `Plugin '${pluginInfo.bundleId}' raised error on require: \n${err}`
        );

        trace(err as Error);
      }
    }

    pluginWorkspace.pluginModules = newPluginModules;
    log(LogType.debug, 'Updated pluginModules', pluginWorkspace.pluginModules);
  },

  cancelPrevious: (): void => {
    _.map(pluginWorkspace.asyncWorks, (work) => {
      if (!work.isCanceled) {
        work.cancel();
      }
    });
  },

  getAsyncWork: (pluginBundleId, asyncPluginPromise): PCancelable<any> => {
    const work = new PCancelable<any>((resolve, reject, onCancel) => {
      const timer = setTimeout(
        () => resolve({ items: [] }),
        pluginWorkspace.asyncPluginTimer
      );

      onCancel(() => {
        resolve({ items: [] });
      });

      asyncPluginPromise
        .then((result) => {
          clearTimeout(timer);
          if (!result.items || !result.items.length) resolve({ items: [] });

          result.items.forEach((item) => {
            item.bundleId = pluginBundleId;
            return item;
          });

          resolve(result);
        })
        .catch(reject);
    });

    work.catch((err) => {
      if (work.isCanceled) {
        return;
      } else {
        throw err;
      }
    });

    return work;
  },

  /**
   * @param  {string} inputStr
   */
  search: async (inputStr: string): Promise<PluginExectionResult[]> => {
    pluginWorkspace.cancelPrevious();

    const pluginExecutionResults: any[] = [];
    const asyncPluginWorks: PCancelable<any>[] = [];

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
            pluginWorkspace.getAsyncWork(pluginBundleId, pluginExecutionResult)
          );
        } else {
          pluginExecutionResult.items.forEach(
            (item) => (item.bundleId = pluginBundleId)
          );

          pluginExecutionResults.push(pluginExecutionResult);
        }
      } catch (err) {
        log(
          LogType.error,
          `Plugin '${pluginBundleId}' raised error on execution: \n${err}`
        );
      }
    }

    pluginWorkspace.asyncWorks = asyncPluginWorks;

    const asyncPluginResults = await Promise.allSettled(asyncPluginWorks);

    const successes = asyncPluginResults
      .filter((result) => result.status === 'fulfilled')
      .map((item) => (item as any).value);

    const errors = asyncPluginResults
      .filter((result) => result.status === 'rejected')
      .map((item) => (item as any).reason)
      .filter((error) => error.name !== 'CancelError');

    const asyncPrintResult = _.flattenDeep(successes);

    asyncPrintResult
      .map((result) => result.items)
      .map((items) => {
        return items
          .filter((item) => item !== null && item !== undefined)
          .map((item) => {
            item.isPluginItem = true;
            // pluginItem is treated like keyword
            item.type = 'keyword';
            item.command = item.title;
            item.action = getPluginList()[item.bundleId].action;
            return item;
          });
      });

    pluginExecutionResults.push(...asyncPrintResult);

    if (WorkManager.getInstance().printPluginItems) {
      log(LogType.info, 'Plugin Items: ', pluginExecutionResults);
    }

    if (errors.length !== 0) {
      for (const error of errors) {
        log(LogType.error, 'Async plugin runtime errors occur\n', error);
      }
    }

    pluginExecutionResults
      .map((result) => result.items)
      .map((items) =>
        items.map(
          (item) =>
            (item.stringSimilarity = compareTwoStrings(
              item.command ? item.command : item.title,
              inputStr
            ))
        )
      );

    return pluginExecutionResults;
  },
};

export default pluginWorkspace;

export { pluginWorkspace };
