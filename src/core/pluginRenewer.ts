import { Store } from '../config/store';

/**
 * @param  {string} bundleId?
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
