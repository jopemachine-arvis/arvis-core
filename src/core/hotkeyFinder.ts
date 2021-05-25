import { Store } from '../config/store';

/**
 * @param  {}
 * @summary Find available workflow hotkeys
 */
const findHotkeys = () => {
  const store = Store.getInstance();
  return store.getHotkeys();
};

export { findHotkeys };
