import { Store } from '../config/store';

/**
 * @param  {string} bundleId
 * @param  {string} outputPath
 * @description Create zip file exporting plugin with bundleId to outputPath
 */
const exportPlugin = (bundleId: string, outputPath: string) => {
  const store = Store.getInstance();
  return store.exportPlugin(bundleId, outputPath);
};

export {
  exportPlugin
};