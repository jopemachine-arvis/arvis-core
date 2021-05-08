import { Store } from '../config/config';

const exportWorkflow = (bundleId: string, outputPath: string) => {
  const store = Store.getInstance();
  return store.exportWorkflow(bundleId, outputPath);
};

export {
  exportWorkflow
};