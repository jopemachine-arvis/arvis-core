import { Store } from '../config/store';

let requestTimer: NodeJS.Timeout;
const requestTimerElapse = 100;

/**
 * @param  {string} bundleId?
 */
const renewWorkflows = async (bundleId?: string): Promise<any> => {
  const store = Store.getInstance();
  if (requestTimer) clearTimeout(requestTimer);

  return new Promise<void>((resolve, reject) => {
    requestTimer = setTimeout(() => {
      store
        .renewWorkflows(bundleId)
        .then(() => resolve())
        .catch(reject);
    }, requestTimerElapse);
  });
};

export { renewWorkflows };
