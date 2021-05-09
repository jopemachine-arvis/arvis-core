import { Store } from '../config/config';

const renewWorkflows = async (bundleId? : string) => {
  const store = Store.getInstance();
  await store.renewWorkflows(bundleId);
};

export {
  renewWorkflows
};