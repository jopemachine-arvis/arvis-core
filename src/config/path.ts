import envPathsGenerator from 'env-paths';
import fse from 'fs-extra';
import path from 'path';
import { checkFileExists } from '../utils';

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
const workflowCachePath = `${cachePath}${path.sep}workflow-cache`;

// Store temp files
const tempPath = envPaths.temp;

/**
 * @summary Create the necessary paths for the Arvis if they don't exists
 */
const initializePath = async () => {
  if (!(await checkFileExists(workflowInstallPath))) {
    await fse.mkdir(workflowInstallPath, { recursive: true });
  }
  if (!(await checkFileExists(workflowDataPath))) {
    await fse.mkdir(workflowDataPath, { recursive: true });
  }
  if (!(await checkFileExists(workflowCachePath))) {
    await fse.mkdir(workflowCachePath, { recursive: true });
  }
  if (!(await checkFileExists(pluginInstallPath))) {
    await fse.mkdir(pluginInstallPath, { recursive: true });
  }
  if (!(await checkFileExists(tempPath))) {
    await fse.mkdir(tempPath, { recursive: true });
  }
};

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
  return `${workflowCachePath}${path.sep}${bundleId}`;
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
  tempPath,
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getWorkflowCachePath,
  getWorkflowInstalledPath,
  getWorkflowConfigJsonPath,
  getPluginInstalledPath,
  getWorkflowDataPath,
  initializePath,
};

export default {
  tempPath,
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getWorkflowCachePath,
  getWorkflowInstalledPath,
  getWorkflowConfigJsonPath,
  getPluginInstalledPath,
  getWorkflowDataPath,
  initializePath,
};
