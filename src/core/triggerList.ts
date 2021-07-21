import { Store } from '../config/store';

/**
 * @param  {}
 * @returns {(Action | Command)[]}
 */
export const getTriggers = (): (Action | Command)[] => {
  const store = Store.getInstance();
  return store.getTriggers();
};
