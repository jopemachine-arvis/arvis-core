import { Store } from '../config/store';

/**
 * @param  {boolean} initializePluginWorkspace
 * @param  {string} bundleId?
 * @description Set initializePluginWorkspace to true only in process to retrieve plugins
 */
const renewPlugins = async ({
  initializePluginWorkspace,
  bundleId,
}: {
  initializePluginWorkspace: boolean;
  bundleId?: string;
}): Promise<any> => {
  const store = Store.getInstance();
  return store.renewPlugins({ initializePluginWorkspace, bundleId });
};

export { renewPlugins };
