const path = require('path');

const arvisEnvs = process.env;

let pluginModules = new Map();
let asyncWorks = [];
let asyncPluginTimer = 100;
let requestId = 0;

const cancelWorks = (asyncWorks) => {
  asyncWorks.forEach((request) => {
    request.cancel();
  });
};

const restoreArvisEnvs = () => {
  process.env = arvisEnvs;
};

const sendMessage = (message, ...optionalParams) => {
  process.send({
    event: 'message',
    payload: JSON.stringify({ message, params: optionalParams })
  });
};

const generateAsyncWork = (pluginBundleId, asyncPluginPromise, setTimer) => {
  const asyncWork = new PCancelable((resolve, reject, onCancel) => {
    let timer;
    let unresolved = false;

    if (setTimer) {
      timer = setTimeout(
        () => {
          unresolved = true;
          reject({
            name: 'Unresolved',
            deferedPluginPromise: generateAsyncWork(pluginBundleId, asyncPluginPromise, false)
          });
        }
        ,
        asyncPluginTimer
      );
    }

    onCancel(() => reject({ name: 'CancelError' }));

    asyncPluginPromise
      .then((result) => {
        if (unresolved) return;
        setTimer && clearTimeout(timer);
        if (!result.items || !result.items.length) resolve({ items: [] });

        result.items = result.items
          .filter(item => !!item)
          .map(item => {
            item.bundleId = pluginBundleId;
            return item;
          });

        resolve(result);
      })
      .catch(reject);
  });

  asyncWork.catch((err) => {
    const expectedCancel = err.name === 'CancelError' || err.name === 'Unresolved';
    if (expectedCancel) return;
    throw err;
  });

  return asyncWork;
};

const getAsyncWork = (pluginBundleId, asyncPluginPromise) => {
  return generateAsyncWork(pluginBundleId, asyncPluginPromise, true);
}

const run = async (query) => {
  cancelWorks(asyncWorks);

  const pluginExecutionResults = [];
  const asyncPluginWorks = [];

  for (const pluginBundleId of pluginModules.keys()) {
    const { module: pluginEntryFunction, bindedEnvs } = pluginModules.get(pluginBundleId);

    process.env = bindedEnvs;

    try {
      const pluginExecutionResult = pluginEntryFunction({
        inputStr: query,
      });

      if (pluginExecutionResult.then) {
        asyncPluginWorks.push(
          getAsyncWork(
            pluginBundleId,
            pluginExecutionResult
          )
        );
      } else {
        pluginExecutionResult.items
          .filter((item) => !!item)
          .forEach((item) => {
            item.bundleId = pluginBundleId;
            return item;
          });

        pluginExecutionResults.push(pluginExecutionResult);
      }
    } catch (err) {
      sendMessage(`Plugin '${pluginBundleId}' raised error on execution\n`, err);
    }
  }

  asyncWorks = asyncPluginWorks;

  const asyncPluginResults = await Promise.allSettled(asyncWorks);

  restoreArvisEnvs();

  const successes =
    asyncPluginResults
      .filter((result) => result.status === 'fulfilled')
      .map(item => item.value);

  const unresolved = asyncPluginResults
    .filter((result) => result.status === 'rejected' && result.reason.name === 'Unresolved')
    .map(item => item.reason.deferedPluginPromise);

  const errors = asyncPluginResults
    .filter((result) => result.status === 'rejected')
    .map(item => item.reason)
    .filter((error) => error.name !== 'CancelError' && error.name !== 'Unresolved');

  const asyncPrintResult = successes.flat(Infinity);
  pluginExecutionResults.push(...asyncPrintResult);

  for (const pluginExecutionResult of pluginExecutionResults) {
    pluginExecutionResult.items = pluginExecutionResult.items.filter(
      (item) => !item.command || item.command.startsWith(query)
    );
  }

  return {
    errors,
    pluginExecutionResults,
    unresolvedPlugins: unresolved,
  };
};

/**
 * Remove cache from existing module for module updates,
 * Add environment variables,
 * And dynamically require new modules using eval.
 */
const requireDynamically = (modulePath, envs) => {
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
    sendMessage('Plugin module cache not deleted', err);
  }

  process.env = { ...process.env, ...envs };

  return eval(`require('${modulePath}');`);
};

const reload = (pluginInfos, bundleIds) => {
  const newPluginModules = bundleIds
    ? pluginModules
    : new Map();

  for (const pluginInfo of pluginInfos) {
    if (!pluginInfo.enabled) continue;

    const modulePath = path.resolve(process.env.pluginInstallPath, pluginInfo.bundleId, pluginInfo.main);

    try {
      const { envs } = pluginInfo;

      newPluginModules.set(pluginInfo.bundleId, {
        bindedEnvs: envs,
        module: requireDynamically(modulePath, envs),
      });

    } catch (err) {
      sendMessage(`Plugin '${pluginInfo.bundleId}' raised error on require: \n`, err);
    }
  }

  pluginModules = newPluginModules;
}

const handleDeferedPlugins = (id, query, deferedPlugins) => {
  let progress = 0;
  const errors = [];
  const deferedPluginResults = [];

  if (id !== requestId) return;

  deferedPlugins.forEach((deferedPluginPromise) => {
    deferedPluginPromise
      .then((updatedItems) => {
        deferedPluginResults.push(updatedItems);
        return null;
      })
      .catch((err) => {
        if (err.name !== 'CancelError') {
          errors.push(err);
        }
      })
      .finally(() => {
        progress += 1;

        if (progress >= deferedPlugins.length) {
          if (id !== requestId) return;

          process.send({
            id,
            query,
            event: 'deferedPluginExecution',
            payload: JSON.stringify({
              errors,
              deferedPluginResults,
            })
          });
        }
      });
  });
};

process.on('message', async ({ id, event, query, pluginInfos, bundleIds, timer }) => {
  switch (event) {
    case 'run':
      // If id equals 0, clear requestId
      if (id === 0) {
        requestId = 0;
      }

      if (id >= requestId) {
        // If requestId equasl id, the request is latest request.
        requestId = id;

        const { errors, pluginExecutionResults, unresolvedPlugins } = await run(query);

        process.send({
          id,
          event: 'pluginExecution',
          payload: JSON.stringify({
            errors,
            pluginExecutionResults,
          })
        });

        handleDeferedPlugins(id, query, unresolvedPlugins);
      }

      break;

    case 'reload':
      reload(JSON.parse(pluginInfos), bundleIds ? JSON.parse(bundleIds) : undefined);
      break;

    case 'setTimer':
      asyncPluginTimer = timer;
      break;

    default:
      sendMessage('Unsupported event type ', event);
      break;
  }
});