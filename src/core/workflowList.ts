import { Store } from '../config/store';

/**
 * @param  {}
 */
export const getWorkflowList = (): Record<string, any> => {
  const store = Store.getInstance();
  return store.getInstalledWorkflows();
};
