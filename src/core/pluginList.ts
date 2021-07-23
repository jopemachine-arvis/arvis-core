import { Store } from '../config/store';

/**
 * Find available plugins
 */
const getPluginList = (): Record<string, PluginConfigFile> => {
  const store = Store.getInstance();
  return store.getPlugins();
};

export { getPluginList };
