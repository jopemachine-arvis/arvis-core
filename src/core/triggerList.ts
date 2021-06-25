import { Store } from '../config/store';

/**
 * @param  {}
 */
const getTriggers = (): any => {
  const store = Store.getInstance();
  return store.getTriggers();
};

export { getTriggers };
