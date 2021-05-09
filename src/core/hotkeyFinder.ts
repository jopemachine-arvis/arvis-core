import { Store } from '../config/store';

const findHotkeys = async () => {
  const store = Store.getInstance();
  return store.getHotkeys();
};

export { findHotkeys };
