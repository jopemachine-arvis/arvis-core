// tslint:disable: no-eval
import { EventEmitter } from 'events';
import execa from 'execa';
import _ from 'lodash';
import { compareTwoStrings } from 'string-similarity';
import { getEnvs, log, LogType } from '../config';
import { getShellPathsEnv } from '../config/envHandler';
import { pluginInstallPath } from '../config/path';
import { ActionFlowManager } from './actionFlowManager';
import { getPluginList } from './pluginList';
const pluginExecutorProcess = require('../../assets/pluginExecutor.json').pluginExecutor;

let pluginExecutor: execa.ExecaChildProcess<string>;

let requestId: number;

let asyncPluginTimer = 100;

export const pluginEventEmitter = new EventEmitter();

export const deferedPluginEventEmitter = new EventEmitter();

let requestIdx = -1;
const generateRequestId = (): number => {
  requestIdx = (requestIdx + 1) % Number.MAX_SAFE_INTEGER;
  return requestIdx;
};

export const requestIsLatest = (id: number) => {
  return requestId === id;
};

export const startPluginExecutor = (): execa.ExecaChildProcess<string> => {
  const env = {
    ...process.env,
    pluginInstallPath,
  };

  if (process.platform !== 'win32') {
    env['PATH'] = getShellPathsEnv();
  }

  pluginExecutor = execa('node', ['--eval', pluginExecutorProcess], {
    env,
    stdio: ['ipc'],
    detached: true,
    extendEnv: true,
    encoding: 'utf8',
  });

  pluginExecutor.on('exit', (exitCode) => {
    throw new Error('PluginExecutor\'s ipc channel was closed!\nExit code: ' + exitCode);
  });

  pluginExecutor.on('error', (err) => {
    log(LogType.error, 'PluginExecutor Error', err);
  });

  pluginExecutor.on('message', async ({ id, event, payload, query }: { id: number; event: string; payload: string; query: string }) => {
    if (event === 'message') {
      const { message, params } = JSON.parse(payload);
      log(LogType.info, message, params);
    }

    if (event === 'pluginExecution') {
      pluginEventEmitter.emit('pluginExecution', { id, event, payload });
    }

    if (event === 'deferedPluginExecution') {
      if (id === requestId) {
        const { deferedPluginResults, errors }: { deferedPluginResults: PluginExectionResult[], errors: Error[] } = JSON.parse(payload);
        const deferedPluginsItems = pluginWorkspace.pluginExecutionHandler(query, deferedPluginResults, errors);

        errors.forEach((error) => log(LogType.error, 'Defered plugin runtime error occurs\n', error));
        deferedPluginEventEmitter.emit('deferedPluginExecution', { id, event, payload: JSON.stringify(deferedPluginsItems) });
      }
    }
  });

  pluginExecutor.send({ event: 'setTimer', timer: asyncPluginTimer });
  pluginExecutor.stderr!.pipe(process.stderr);
  return pluginExecutor;
};

export const pluginWorkspace: PluginWorkspace = {
  executingAsyncPlugins: false,

  deferedPluginEventEmitter,

  requestIsLatest,

  pluginModules: new Map(),

  setAsyncPluginTimer: (timer: number): void => {
    asyncPluginTimer = timer;
    pluginExecutor && pluginExecutor.send({ event: 'setTimer', timer });
  },

  reload: (pluginInfos: (PluginConfigFile & { envs?: Record<string, any> })[], bundleIds?: string[]): void => {
    for (const pluginInfo of pluginInfos) {
      pluginInfo.envs = getEnvs({
        extensionType: 'plugin',
        bundleId: pluginInfo.bundleId!,
        name: pluginInfo.name,
        version: pluginInfo.version,
        vars: pluginInfo.variables ?? {},
      });
    }

    pluginExecutor.send({
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

  pluginExecutionHandler: (inputStr: string, pluginExecutionResults: PluginExectionResult[], errors?: Error[]): PluginExectionResult[] => {
    errors && errors.forEach((error) => log(LogType.error, 'Async plugin runtime error occurs\n', error));

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
    requestId = generateRequestId();
    pluginExecutor.send({ id: requestId, event: 'run', query: inputStr });

    return new Promise(async (resolve, _reject) => {
      const retrieveHandler =
        async ({ id, event, payload }: { id: number; event: string; payload: string }) => {
          if (id === requestId && event === 'pluginExecution') {
            const { pluginExecutionResults, errors }: { pluginExecutionResults: PluginExectionResult[], errors: Error[] } = JSON.parse(payload);
            resolve(pluginWorkspace.pluginExecutionHandler(inputStr, pluginExecutionResults, errors));
          }
        };

      pluginEventEmitter.removeAllListeners();
      pluginEventEmitter.on('pluginExecution', retrieveHandler);
    });
  },
};
