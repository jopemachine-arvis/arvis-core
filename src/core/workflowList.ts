import { Store } from '../config/store';

/**
 * @param  {}
 */
const getWorkflowList = (): any => {
  const store = Store.getInstance();
  return store.getInstalledWorkflows();
};

export { getWorkflowList };
