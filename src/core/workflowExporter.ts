import { Store } from '../config/store';

/**
 * @param  {string} bundleId
 * @param  {string} outputPath
 * @description Create zip file exporting workflow with bundleId to outputPath
 */
const exportWorkflow = (bundleId: string, outputPath: string) => {
  const store = Store.getInstance();
  return store.exportWorkflow(bundleId, outputPath);
};

export {
  exportWorkflow
};