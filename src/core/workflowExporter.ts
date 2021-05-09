import { Store } from '../config/store';

const exportWorkflow = (bundleId: string, outputPath: string) => {
  const store = Store.getInstance();
  return store.exportWorkflow(bundleId, outputPath);
};

export {
  exportWorkflow
};