import { Store } from '../config/store';

/**
 * @param  {}
 * @summary Find available plugins
 */
const getPluginList = (): Record<string, any> => {
  const store = Store.getInstance();
  return store.getPlugins();
};

export { getPluginList };
