import { Store } from '../config/store';

/**
 * @param  {}
 */
export const getWorkflowList = (): Record<string, WorkflowConfigFile> => {
  const store = Store.getInstance();
  return store.getInstalledWorkflows();
};
