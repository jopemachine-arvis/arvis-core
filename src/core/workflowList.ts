import { Store } from '../config/store';

/**
 * @param  {}
 */
const getWorkflowList = () => {
  const store = Store.getInstance();
  return store.getInstalledWorkflows();
};

export {
  getWorkflowList
};