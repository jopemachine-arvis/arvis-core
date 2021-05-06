import { createStore } from '../config/config';
import { StoreType } from '../types/storeType';

const findHotkeys = async (storeType: StoreType) => {
  const store = await createStore(storeType);
  return store.getHotkeys();
};

export { findHotkeys };
