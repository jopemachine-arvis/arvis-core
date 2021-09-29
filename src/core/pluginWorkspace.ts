// tslint:disable: no-eval
import { EventEmitter } from 'events';
import execa from 'execa';
import _ from 'lodash';
import parseJson from 'parse-json';
import { compareTwoStrings } from 'string-similarity';
import { getEnvs, log, LogType } from '../config';
import { getShellPathsEnv } from '../config/envHandler';
import { pluginInstallPath } from '../config/path';
import { ActionFlowManager } from './actionFlowManager';
import { getPluginList } from './pluginList';
const pluginExecutorProcess = require('../../assets/pluginExecutor.json').pluginExecutor;

let requestId: number;

let asyncPluginTimer = 100;

let executingAsyncPlugins = false;

let executingDeferedPlugins = false;

let requestIdx = -1;
const generateRequestId = (): number => {
  requestIdx = (requestIdx + 1) % Number.MAX_SAFE_INTEGER;
  return requestIdx;
};

export const setIsExecutingAsyncPlugins = (value: boolean) => {
  executingAsyncPlugins = value;
};

export const setIsExecutingDeferedPlugins = (value: boolean) => {
  executingDeferedPlugins = value;
};

const throwErrorIfExecutorNotSet = () => {
  if (!pluginWorkspace.pluginExecutor) {
    throw new Error('pluginExecutor is not initialized!');
  }
};

export const pluginWorkspace: PluginWorkspace = {
  pluginExecutor: undefined,

  pluginModules: new Map(),

  pluginEventEmitter: new EventEmitter(),

  deferedPluginEventEmitter: new EventEmitter(),

  asyncQuicklookRenderEventEmitter: new EventEmitter(),

  startPluginExecutor: (): execa.ExecaChildProcess<string> => {
    const env = {
      ...process.env,
      pluginInstallPath,
    };

    if (process.platform !== 'win32') {
      env['PATH'] = getShellPathsEnv();
    }

    pluginWorkspace.pluginExecutor = execa('node', ['--eval', pluginExecutorProcess], {
      all: true,
      env,
      stdio: ['ipc'],
      detached: true,
      extendEnv: true,
      encoding: 'utf8',
    });

    pluginWorkspace.pluginExecutor.on('exit', (exitCode) => {
      throw new Error('PluginExecutor\'s ipc channel was closed!\nExit code: ' + exitCode);
    });

    pluginWorkspace.pluginExecutor.on('error', (err) => {
      log(LogType.error, 'PluginExecutor Error', err);
    });

    pluginWorkspace.pluginExecutor.on('message', async ({ id, event, payload, query }: { id: number; event: string; payload: string; query: string }) => {
      if (event === 'pluginExecution') {
        pluginWorkspace.pluginEventEmitter.emit('pluginExecution', { id, event, payload });
      }

      if (event === 'renderAsyncQuicklookResponse') {
        pluginWorkspace.asyncQuicklookRenderEventEmitter.emit('render', payload);
      }

      if (event === 'deferedPluginExecution') {
        if (id === requestId) {
          const deferedPluginResults: PluginExectionResult[] = parseJson(payload);
          const deferedPluginsItems = pluginWorkspace.pluginExecutionHandler(query, deferedPluginResults);

          setIsExecutingDeferedPlugins(false);
          pluginWorkspace.deferedPluginEventEmitter.emit('render', { id, event, payload: JSON.stringify(deferedPluginsItems) });
        }
      }
    });

    pluginWorkspace.pluginExecutor.send({ event: 'setTimer', timer: asyncPluginTimer });
    pluginWorkspace.pluginExecutor.all!.pipe(process.stdout);
    return pluginWorkspace.pluginExecutor;
  },

  requestIsLatest: (id: number) => {
    return requestId === id;
  },

  isExecutingAsyncPlugins: () => executingAsyncPlugins,

  isExecutingDeferedPlugins: () => executingDeferedPlugins,

  setAsyncPluginTimer: (timer: number): void => {
    asyncPluginTimer = timer;
    pluginWorkspace.pluginExecutor && pluginWorkspace.pluginExecutor.send({ event: 'setTimer', timer });
  },

  requestAsyncQuicklookRender: (asyncQuicklookItemUid: string) => {
    throwErrorIfExecutorNotSet();

    return new Promise<string>((resolve) => {
      pluginWorkspace.pluginExecutor!.send({
        event: 'renderAsyncQuicklook',
        asyncQuicklookItemUid,
      });

      pluginWorkspace.asyncQuicklookRenderEventEmitter.removeAllListeners();
      pluginWorkspace.asyncQuicklookRenderEventEmitter.on('render', (payload: { content: string } & any) => {
        const { content, asyncQuicklookItemUid: uid } = parseJson(payload);
        if (uid === asyncQuicklookItemUid) {
          resolve(content);
        }
      });
    });
  },

  reload: (pluginInfos: (PluginConfigFile & { envs?: Record<string, any> })[], bundleIds?: string[]): void => {
    throwErrorIfExecutorNotSet();

    for (const pluginInfo of pluginInfos) {
      pluginInfo.envs = getEnvs({
        extensionType: 'plugin',
        bundleId: pluginInfo.bundleId!,
        name: pluginInfo.name,
        version: pluginInfo.version,
        vars: pluginInfo.variables ?? {},
      });
    }

    pluginWorkspace.pluginExecutor!.send({
      event: 'reload',
      bundleIds: JSON.stringify(bundleIds),
      pluginInfos: JSON.stringify(pluginInfos),
    });
  },

  appendPluginItemAttr: (inputStr: string, pluginExectionResults: PluginExectionResult[]) => {
    pluginExectionResults
      .map((result) => result.items)
      .map((items) =>
        items
          .filter((item: PluginItem | undefined) => !!item)
          .map((item: PluginItem) => {
            if (!item.icon && getPluginList()[item.bundleId!].defaultIcon) {
              item.icon = {
                path: getPluginList()[item.bundleId!].defaultIcon,
              };
            }

            const stringSimilarityCompareTarget = item.command ?? item.title;

            // pluginItem is treated like keyword
            item.type = 'keyword';
            item.isPluginItem = true;
            item.actions = getPluginList()[item.bundleId!].actions;

            item.stringSimilarity = compareTwoStrings(
              stringSimilarityCompareTarget.toString(),
              inputStr.toString()
            );
          })
      );
  },

  debug: (pluginExecutionResults: PluginExectionResult[]) => {
    if (ActionFlowManager.getInstance().printPluginItems) {
      const debuggingResult = {};
      for (const res of pluginExecutionResults) {
        if (res.items.length > 0) {
          debuggingResult[res.items[0].bundleId!] = res;
        }
      }

      log(LogType.info, 'Executed plugins information', debuggingResult);
    }
  },

  pluginExecutionHandler: (inputStr: string, pluginExecutionResults: PluginExectionResult[]): PluginExectionResult[] => {
    pluginWorkspace.appendPluginItemAttr(inputStr, pluginExecutionResults);

    for (const pluginExecutionResult of pluginExecutionResults) {
      pluginExecutionResult.items = pluginExecutionResult.items.filter(
        (item: any) => !item.command || item.command.startsWith(inputStr)
      );
    }

    pluginWorkspace.debug(pluginExecutionResults);

    return pluginExecutionResults;
  },

  search: async (inputStr: string): Promise<PluginExectionResult[]> => {
    if (!pluginWorkspace.pluginExecutor) return [];

    requestId = generateRequestId();
    pluginWorkspace.pluginExecutor.send({ id: requestId, event: 'run', query: inputStr });

    return new Promise(async (resolve, _reject) => {
      const retrieveHandler =
        async ({ id, event, payload }: { id: number; event: string; payload: string }) => {
          if (id === requestId && event === 'pluginExecution') {
            const {
              hasDeferedPluings,
              pluginExecutionResults,
            }: {
              hasDeferedPluings: boolean,
              pluginExecutionResults: PluginExectionResult[],
            } = parseJson(payload);

            setIsExecutingDeferedPlugins(hasDeferedPluings);
            resolve(pluginWorkspace.pluginExecutionHandler(inputStr, pluginExecutionResults));
          }
        };

      pluginWorkspace.pluginEventEmitter.removeAllListeners();
      pluginWorkspace.pluginEventEmitter.on('pluginExecution', retrieveHandler);
    });
  },
};
