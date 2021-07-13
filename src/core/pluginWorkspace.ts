// tslint:disable: no-eval
import isPromise from 'is-promise';
import _ from 'lodash';
import PCancelable from 'p-cancelable';
import path from 'path';
import { compareTwoStrings } from 'string-similarity';
import { getEnvs, getHistory, log, LogType } from '../config';
import { trace } from '../config/logger';
import { getPluginInstalledPath } from '../config/path';
import { ActionFlowManager } from './actionFlowManager';
import { getPluginList } from './pluginList';

const arvisEnvs = process.env;

/**
 * @param  {string} modulePath
 * @summary Remove cache from existing module for module updates,
 *          Add environment variables,
 *          And dynamically require new modules using eval.
 */
const requireDynamically = (modulePath: string, envs: Record<string, any> = {}): any => {
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

  process.env = { ...process.env, ...envs };

  return eval(`require('${modulePath}');`);
};

export const pluginWorkspace: PluginWorkspace = {
  pluginModules: new Map(),

  asyncWorks: [],

  asyncPluginTimer: 100,

  setAsyncPluginTimer: (timer: number): void => {
    pluginWorkspace.asyncPluginTimer = timer;
  },

  restoreArvisEnvs: () => {
    process.env = arvisEnvs as any;
  },

  /**
   * @param  {any[]} pluginInfos
   */
  reload: (pluginInfos: any[], bundleId?: string): void => {
    const newPluginModules: Map<string, PluginModule> = bundleId
      ? pluginWorkspace.pluginModules
      : new Map();

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
          vars: pluginInfo.variables ?? {},
        });

        newPluginModules.set(pluginInfo.bundleId, {
          bindedEnvs: envs,
          module: requireDynamically(modulePath, envs),
        });

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
        () => work.cancel(),
        pluginWorkspace.asyncPluginTimer
      );

      onCancel(() => {
        reject({
          name: 'CancelError',
        });
      });

      asyncPluginPromise
        .then((result) => {
          clearTimeout(timer);
          if (!result.items || !result.items.length) resolve({ items: [] });

          result.items = result.items
            .filter((item: any) => !!item)
            .map((item: any) => {
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

    for (const pluginBundleId of pluginWorkspace.pluginModules.keys()) {
      if (!getPluginList()[pluginBundleId].enabled) continue;
      const { module: pluginModule, bindedEnvs } =
        pluginWorkspace.pluginModules.get(pluginBundleId)!;

      process.env = bindedEnvs as any;

      try {
        const pluginExecutionResult = (pluginModule as Function)({
          inputStr,
          history: getHistory(),
        });

        if (isPromise(pluginExecutionResult)) {
          asyncPluginWorks.push(
            pluginWorkspace.getAsyncWork(
              pluginBundleId,
              pluginExecutionResult as Promise<any>
            )
          );
        } else {
          pluginExecutionResult.items
            .filter((item: any) => !!item)
            .forEach((item: any) => {
              item.bundleId = pluginBundleId;
              return item;
            });

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
    pluginWorkspace.restoreArvisEnvs();

    const successes = asyncPluginResults
      .filter((result) => result.status === 'fulfilled')
      .map((item) => (item as any).value);

    const errors: Error[] = asyncPluginResults
      .filter((result) => result.status === 'rejected')
      .map((item) => (item as any).reason)
      .filter((error) => error.name !== 'CancelError');

    const asyncPrintResult = _.flattenDeep(successes);
    pluginExecutionResults.push(...asyncPrintResult);

    if (errors.length !== 0) {
      for (const error of errors) {
        log(LogType.error, 'Async plugin runtime errors occur\n', error);
      }
    }

    pluginExecutionResults
      .map((result) => result.items)
      .map((items) =>
        items
          .filter((item: any) => !!item)
          .map((item: any) => {
            if (!item.icon && getPluginList()[item.bundleId].defaultIcon) {
              item.icon = {
                path: getPluginList()[item.bundleId].defaultIcon,
              };
            }

            const compareTarget = item.command ? item.command : item.title;

            // pluginItem is treated like keyword
            item.type = 'keyword';
            item.isPluginItem = true;
            item.actions = getPluginList()[item.bundleId].actions;

            item.stringSimilarity = compareTwoStrings(
              compareTarget.toString(),
              inputStr.toString()
            );
          })
      );

    for (const pluginExecutionResult of pluginExecutionResults) {
      pluginExecutionResult.items = pluginExecutionResult.items.filter(
        (item: any) => !item.command || item.command.startsWith(inputStr)
      );
    }

    if (ActionFlowManager.getInstance().printPluginItems) {
      log(LogType.info, 'Plugin Items: ', pluginExecutionResults);
    }

    return pluginExecutionResults;
  },
};
