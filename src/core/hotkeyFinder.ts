import { Store } from '../config/store';

/**
 * @param  {}
 * @summary Find available workflow hotkeys
 */
const findHotkeys = async (): Promise<any> => {
  const store = Store.getInstance();
  return store.getHotkeys();
};

export { findHotkeys };
