import { Store } from '../config/store';

/**
 * @param  {}
 * @summary Find available workflow hotkeys
 */
const findHotkeys = async () => {
  const store = Store.getInstance();
  return store.getHotkeys();
};

export { findHotkeys };
