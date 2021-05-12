import envPathsGenerator from 'env-paths';
import path from 'path';

const envPaths = envPathsGenerator('arvis');

const installedDataPath = envPaths.data;
// Store workflow's data
const workflowDataPath = `${installedDataPath}${path.sep}workflow-data`;

// Store workflow files
const workflowInstallPath = `${installedDataPath}${path.sep}workflows`;

// Store plugin's files
const pluginInstallPath = `${installedDataPath}${path.sep}plugins`;

// Store workflow's caches
const cachePath = envPaths.cache;
const workflowCache = `${cachePath}${path.sep}workflow-cache`;

/**
 * @param  {string} bundleId
 */
const getWorkflowDataPath = (bundleId: string) => {
  return `${workflowDataPath}${path.sep}${bundleId}`;
};

/**
 * @param  {string} bundleId
 */
const getWorkflowCachePath = (bundleId: string) => {
  return `${workflowCache}${path.sep}${bundleId}`;
};

/**
 * @param  {string} bundleId
 */
const getWorkflowInstalledPath = (bundleId: string) => {
  return `${workflowInstallPath}${path.sep}${bundleId}`;
};

/**
 * @param  {string} bundleId
 */
const getPluginInstalledPath = (bundleId: string) => {
  return `${pluginInstallPath}${path.sep}${bundleId}`;
};

/**
 * @param  {string} bundleId
 */
const getWorkflowConfigJsonPath = (bundleId: string) => {
  return `${getWorkflowInstalledPath(bundleId)}${path.sep}arvis-workflow.json`;
};

export {
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getWorkflowCachePath,
  getWorkflowInstalledPath,
  getWorkflowConfigJsonPath,
  getPluginInstalledPath,
  getWorkflowDataPath,
};

export default {
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getWorkflowConfigJsonPath,
  getWorkflowInstalledPath,
  getPluginInstalledPath,
};
