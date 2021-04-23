import { createStore } from '../config/config';
import { StoreType } from '../types/storeType';

const getWorkflowList = async (storeType: StoreType) => {
  const store = await createStore(storeType);
  return store.getInstalledWorkflows();
};

export {
  getWorkflowList
};