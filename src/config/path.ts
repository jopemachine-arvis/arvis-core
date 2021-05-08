import envPathsGenerator from 'env-paths';
import path from 'path';

const envPaths = envPathsGenerator('arvis');
const installedDataPath = envPaths.data;
const workflowInstallPath = `${installedDataPath}${path.sep}workflows`;
const pluginInstallPath = `${installedDataPath}${path.sep}plugins`;

const getWorkflowInstalledPath = (bundleId: string) => {
  return `${workflowInstallPath}${path.sep}${bundleId}`;
};

const getPluginInstalledPath = (bundleId: string) => {
  return `${pluginInstallPath}${path.sep}${bundleId}`;
};

const getWorkflowConfigJsonPath = (bundleId: string) => {
  return `${getWorkflowInstalledPath(bundleId)}${path.sep}arvis-workflow.json`;
};

export {
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getWorkflowInstalledPath,
  getWorkflowConfigJsonPath,
  getPluginInstalledPath
};

export default {
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getWorkflowConfigJsonPath,
  getWorkflowInstalledPath,
  getPluginInstalledPath
};
