import { Store } from '../config/store';

let requestTimer: NodeJS.Timeout;
const requestTimerElapse = 100;

/**
 * @param  {boolean} initializePluginWorkspace
 * @param  {string} bundleId?
 * @param  {string[]} bundleIds?
 * @returns {Promise<void>}
 * @description Set initializePluginWorkspace to true only in process to retrieve plugins
 */
export const reloadPlugins = async ({
  initializePluginWorkspace,
  bundleId,
  bundleIds,
}: {
  initializePluginWorkspace: boolean;
  bundleId?: string;
  bundleIds?: string[];
}): Promise<void> => {
  const store = Store.getInstance();
  if (requestTimer) clearTimeout(requestTimer);

  return new Promise<void>((resolve, reject) => {
    requestTimer = setTimeout(() => {
      store
        .reloadPlugins({ initializePluginWorkspace, bundleIds: bundleId ? [bundleId] : bundleIds })
        .then(() => resolve())
        .catch(reject);
    }, requestTimerElapse);
  });
};
