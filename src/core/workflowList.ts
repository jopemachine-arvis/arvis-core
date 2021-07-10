import { Store } from '../config/store';

/**
 * @param  {}
 */
export const getWorkflowList = (): any => {
  const store = Store.getInstance();
  return store.getInstalledWorkflows();
};
