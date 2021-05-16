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
}) => {
  const store = Store.getInstance();
  await store.renewPlugins({ initializePluginWorkspace, bundleId });
};

export { renewPlugins };
