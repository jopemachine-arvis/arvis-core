const path = require('path');

const arvisEnvs = process.env;

let asyncWorks = [];
let asyncPluginTimer = 100;
let requestId = 0;

// Map<bundleId, pluginEntryFunction>
let pluginModules = new Map();

// Map<itemUid, asyncQuicklookPromise>
let asyncQuicklookPromises = new Map();

const cancelWorks = (asyncWorks) => {
  asyncWorks.forEach((request) => {
    request.cancel();
  });
};

const restoreArvisEnvs = () => {
  process.env = arvisEnvs;
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

const isPromise = (obj) => {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

const getAsyncWork = (pluginBundleId, asyncPluginPromise) => {
  return generateAsyncWork(pluginBundleId, asyncPluginPromise, true);
}

const handleAsyncQuicklookItems = (items, defered) => {
  let itemIdx = 0;
  items.forEach((item) => {
    if (item.quicklook && isPromise(item.quicklook.data)) {
      item.quicklook.asyncQuicklookItemUid = defered ?
        `defered@${item.bundleId}/${itemIdx++}` :
        `@${item.bundleId}/${itemIdx++}`;

      asyncQuicklookPromises.set(item.quicklook.asyncQuicklookItemUid, item.quicklook.data);
    }
  });

  return items;
};

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

      if (isPromise(pluginExecutionResult)) {
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
      console.log(`Plugin '${pluginBundleId}' raised error on execution\n`, err);
    }
  }

  asyncWorks = asyncPluginWorks;

  const asyncPluginResults = await Promise.allSettled(asyncWorks);

  asyncQuicklookPromises.clear();

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

  errors.forEach((error) => console.log('Async plugin runtime error occurs\n', error));

  const asyncPrintResult = successes.flat(Infinity);
  pluginExecutionResults.push(...asyncPrintResult);

  for (const pluginExecutionResult of pluginExecutionResults) {
    pluginExecutionResult.items = pluginExecutionResult.items.filter(
      (item) => !item.command || item.command.startsWith(query)
    );

    handleAsyncQuicklookItems(pluginExecutionResult.items, false);
  }

  return {
    pluginExecutionResults,
    deferedPluginPromises: unresolved,
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
    console.log(`Plugin module '${modulePath}' cache not deleted\n`, err);
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
      console.log(`Plugin '${pluginInfo.bundleId}' raised error on require: \n`, err);
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
        deferedPluginResults.push(handleAsyncQuicklookItems(updatedItems, true));
        return null;
      })
      .catch((err) => {
        if (err.name !== 'CancelError') {
          errors.push(err);
        }
      })
      .finally(() => {
        progress += 1;

        errors.forEach((error) => console.log('Defered plugin runtime error occurs\n', error));

        if (progress >= deferedPlugins.length) {
          if (id !== requestId) return;

          process.send({
            id,
            query,
            event: 'deferedPluginExecution',
            payload: JSON.stringify(deferedPluginResults)
          });
        }
      });
  });
};

const handleRenderAsyncQuicklook = (asyncQuicklookItemUid) => {
  if (asyncQuicklookPromises.has(asyncQuicklookItemUid)) {
    asyncQuicklookPromises.get(asyncQuicklookItemUid).then((content) => {
      process.send({
        event: 'renderAsyncQuicklookResponse',
        payload: JSON.stringify({
          content,
          asyncQuicklookItemUid
        })
      });
    }).catch(console.log);
  }
};

process.on('message', async ({ id, event, query, pluginInfos, bundleIds, timer, asyncQuicklookItemUid }) => {
  switch (event) {
    case 'run':
      // If id equals 0, clear requestId
      if (id === 0) {
        requestId = 0;
      }

      if (id >= requestId) {
        // If requestId equasl id, the request is latest request.
        requestId = id;

        const { pluginExecutionResults, deferedPluginPromises } = await run(query);

        process.send({
          id,
          event: 'pluginExecution',
          payload: JSON.stringify({
            pluginExecutionResults,
            hasDeferedPluings: deferedPluginPromises.length > 0,
          })
        });

        handleDeferedPlugins(id, query, deferedPluginPromises);
      }

      break;

    case 'reload':
      reload(JSON.parse(pluginInfos), bundleIds ? JSON.parse(bundleIds) : undefined);
      break;

    case 'setTimer':
      asyncPluginTimer = timer;
      break;

    case 'renderAsyncQuicklook':
      handleRenderAsyncQuicklook(asyncQuicklookItemUid);
      break;

    default:
      console.log('Unsupported event type ', event);
      break;
  }
});