import { Store } from '../config/store';

let requestTimer: NodeJS.Timeout;
const requestTimerElapse = 100;

/**
 * @param  {string} bundleId?
 */
export const reloadWorkflows = async (bundleId?: string): Promise<void> => {
  const store = Store.getInstance();
  if (requestTimer) clearTimeout(requestTimer);

  return new Promise<void>((resolve, reject) => {
    requestTimer = setTimeout(() => {
      store
        .reloadWorkflows(bundleId)
        .then(() => resolve())
        .catch(reject);
    }, requestTimerElapse);
  });
};
