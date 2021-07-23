import { Store } from '../config/store';

/**
 * Create zip file exporting plugin with bundleId to outputPath
 * @param bundleId
 * @param outputPath
 */
export const exportPlugin = (bundleId: string, outputPath: string): Promise<void> => {
  const store = Store.getInstance();
  return store.exportPlugin(bundleId, outputPath);
};
