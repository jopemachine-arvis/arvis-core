import { Store } from '../config/store';

let requestTimer: NodeJS.Timeout;
const requestTimerElapse = 100;

/**
 * @param  {boolean} initializePluginWorkspace
 * @param  {string} bundleId?
 * @description Set initializePluginWorkspace to true only in process to retrieve plugins
 */
const renewPlugins = async ({
  initializePluginWorkspace,
  bundleId,
}: {
  initializePluginWorkspace: boolean;
  bundleId?: string;
}): Promise<any> => {
  const store = Store.getInstance();
  if (requestTimer) clearTimeout(requestTimer);

  return new Promise<void>((resolve, reject) => {
    requestTimer = setTimeout(() => {
      store
        .renewPlugins({ initializePluginWorkspace, bundleId })
        .then(() => resolve())
        .catch(reject);
    }, requestTimerElapse);
  });
};

export { renewPlugins };
