import { Store } from '../config/store';

/**
 * @param  {}
 */
const findHotkeys = async () => {
  const store = Store.getInstance();
  return store.getHotkeys();
};

export { findHotkeys };
