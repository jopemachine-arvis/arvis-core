import { Store } from '../config/store';

let requestTimer: NodeJS.Timeout;
const requestTimerElapse = 100;

/**
 * Set initializePluginWorkspace to true only in process to retrieve plugins
 * @param initializePluginWorkspace
 * @param bundleId?
 * @param bundleIds?
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
