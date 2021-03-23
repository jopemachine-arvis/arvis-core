import { getInstalledWorkflows } from '../config/config';

const getWorkflowList = () => {
  return getInstalledWorkflows();
};

export {
  getWorkflowList
};