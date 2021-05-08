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

export {
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getWorkflowInstalledPath,
  getPluginInstalledPath
};

export default {
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getWorkflowInstalledPath,
  getPluginInstalledPath
};
