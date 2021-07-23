import { Store } from '../config/store';

/**
 * Create zip file exporting workflow with bundleId to outputPath
 * @param bundleId
 * @param outputPath
 */
export const exportWorkflow = (
  bundleId: string,
  outputPath: string
): Promise<void> => {
  const store = Store.getInstance();
  return store.exportWorkflow(bundleId, outputPath);
};
