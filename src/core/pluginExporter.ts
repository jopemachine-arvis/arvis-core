import { Store } from '../config/store';

/**
 * @param  {string} bundleId
 * @param  {string} outputPath
 * @description Create zip file exporting plugin with bundleId to outputPath
 */
export const exportPlugin = (bundleId: string, outputPath: string): Promise<void> => {
  const store = Store.getInstance();
  return store.exportPlugin(bundleId, outputPath);
};
