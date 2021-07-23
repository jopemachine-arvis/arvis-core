import { Store } from '../config/store';

/**
 */
export const getWorkflowList = (): Record<string, WorkflowConfigFile> => {
  const store = Store.getInstance();
  return store.getInstalledWorkflows();
};
