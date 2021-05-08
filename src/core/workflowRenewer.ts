import { Store } from '../config/config';

const renewWorkflows = async () => {
  const store = Store.getInstance();
  await store.renewWorkflows();
};

export {
  renewWorkflows
};