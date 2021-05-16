import { Store } from '../config/store';

/**
 * @param  {}
 * @summary Find available plugins
 */
const getPluginList = async () => {
  const store = Store.getInstance();
  return store.getPlugins();
};

export { getPluginList };