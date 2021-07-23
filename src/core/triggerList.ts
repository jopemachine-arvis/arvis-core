import { Store } from '../config/store';

/**
 */
export const getTriggers = (): (Action | Command)[] => {
  const store = Store.getInstance();
  return store.getTriggers();
};
