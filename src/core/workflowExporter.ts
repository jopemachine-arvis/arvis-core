import { Store } from '../config/store';

/**
 * @param  {string} bundleId
 * @param  {string} outputPath
 */
const exportWorkflow = (bundleId: string, outputPath: string) => {
  const store = Store.getInstance();
  return store.exportWorkflow(bundleId, outputPath);
};

export {
  exportWorkflow
};