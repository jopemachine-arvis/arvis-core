import { Store } from '../config/store';

/**
 * @param  {string} bundleId?
 */
const renewWorkflows = async (bundleId? : string) => {
  const store = Store.getInstance();
  await store.renewWorkflows(bundleId);
};

export {
  renewWorkflows
};