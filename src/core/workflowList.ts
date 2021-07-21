import { Store } from '../config/store';

/**
 * @param  {}
 * @returns {Record<string, WorkflowConfigFile>}
 */
export const getWorkflowList = (): Record<string, WorkflowConfigFile> => {
  const store = Store.getInstance();
  return store.getInstalledWorkflows();
};
