import { Store } from '../config/store';

let requestTimer: NodeJS.Timeout;
const requestTimerElapse = 100;

/**
 * @param  {string | string[]} bundleIds?
 * @returns {Promise<void>}
 */
export const reloadWorkflows = async (bundleIds?: string | string[]): Promise<void> => {
  const store = Store.getInstance();
  if (requestTimer) clearTimeout(requestTimer);

  return new Promise<void>((resolve, reject) => {
    requestTimer = setTimeout(() => {
      store
        .reloadWorkflows(typeof bundleIds === 'string' ? [bundleIds] : bundleIds)
        .then(() => resolve())
        .catch(reject);
    }, requestTimerElapse);
  });
};
