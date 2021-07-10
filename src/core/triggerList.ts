import { Store } from '../config/store';

/**
 * @param  {}
 */
export const getTriggers = (): any => {
  const store = Store.getInstance();
  return store.getTriggers();
};
