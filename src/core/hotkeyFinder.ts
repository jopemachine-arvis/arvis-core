import { Store } from '../config/config';

const findHotkeys = async () => {
  const store = Store.getInstance();
  return store.getHotkeys();
};

export { findHotkeys };
