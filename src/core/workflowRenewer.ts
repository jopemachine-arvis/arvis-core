import { Store } from '../config/store';

/**
 * @param  {string} bundleId?
 */
const renewWorkflows = async (bundleId?: string): Promise<any> => {
  const store = Store.getInstance();
  return store.renewWorkflows(bundleId);
};

export { renewWorkflows };
