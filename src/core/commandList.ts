import { createStore } from '../config/config';
import { StoreType } from '../types/storeType';

const getCommandList = async (storeType: StoreType) => {
  const store = await createStore(storeType);
  return store.getCommands();
};

export {
  getCommandList
};