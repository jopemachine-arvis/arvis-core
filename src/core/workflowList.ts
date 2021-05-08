import { Store } from '../config/config';

const getWorkflowList = () => {
  const store = Store.getInstance();
  return store.getInstalledWorkflows();
};

export {
  getWorkflowList
};