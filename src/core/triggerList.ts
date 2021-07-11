import { Store } from '../config/store';

/**
 * @param  {}
 */
export const getTriggers = (): Record<string, any> => {
  const store = Store.getInstance();
  return store.getTriggers();
};
