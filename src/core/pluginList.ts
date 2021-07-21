import { Store } from '../config/store';

/**
 * @param  {}
 * @returns {Record<string, PluginConfigFile>}
 * @summary Find available plugins
 */
const getPluginList = (): Record<string, PluginConfigFile> => {
  const store = Store.getInstance();
  return store.getPlugins();
};

export { getPluginList };
