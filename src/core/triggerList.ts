import { Store } from '../config/store';

/**
 */
export const getTriggers = (): Record<string, (Action | Command)[]> => {
  const store = Store.getInstance();
  return store.getTriggers();
};
