import { Store } from '../config/store';

const getWorkflowList = () => {
  const store = Store.getInstance();
  return store.getInstalledWorkflows();
};

export {
  getWorkflowList
};