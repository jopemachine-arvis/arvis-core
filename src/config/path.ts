import envPathsGenerator from 'env-paths';
import fse from 'fs-extra';
import path from 'path';
import { getHistoryFilePath } from '../config';
import { checkFileExists } from '../utils';

const envPaths = envPathsGenerator('arvis');

const installedDataPath = envPaths.data;
const cachePath = envPaths.cache;

/**
 * @description Store workflow, plugin data
 */
const extensionDataPath = path.resolve(installedDataPath, 'data');

/**
 * @description Store workflow, plugin caches
 */
const extensionCachePath = path.resolve(cachePath, 'cache');

/**
 * @description Store workflow files
 */
const workflowInstallPath = path.resolve(installedDataPath, 'workflows');

/**
 * @description Store plugin's files
 */
const pluginInstallPath = path.resolve(installedDataPath, 'plugins');

/**
 * @description Store temp files
 */
const tempPath = envPaths.temp;

/**
 * @summary Create the necessary paths for the Arvis if they don't exists
 */
const initializePath = async () => {
  if (!(await checkFileExists(workflowInstallPath))) {
    await fse.mkdir(workflowInstallPath, { recursive: true });
  }
  if (!(await checkFileExists(extensionDataPath))) {
    await fse.mkdir(extensionDataPath, { recursive: true });
  }
  if (!(await checkFileExists(extensionCachePath))) {
    await fse.mkdir(extensionCachePath, { recursive: true });
  }
  if (!(await checkFileExists(pluginInstallPath))) {
    await fse.mkdir(pluginInstallPath, { recursive: true });
  }
  if (!(await checkFileExists(tempPath))) {
    await fse.mkdir(tempPath, { recursive: true });
  }
};

/**
 * @summary
 */
const getExtensionHistoryPath = () => {
  return getHistoryFilePath();
};

/**
 * @param  {string} bundleId
 */
const getExtensionDataPath = (bundleId: string) => {
  return path.resolve(extensionDataPath, bundleId);
};

/**
 * @param  {string} bundleId
 */
const getExtensionCachePath = (bundleId: string) => {
  return path.resolve(extensionCachePath, bundleId);
};

/**
 * @param  {string} bundleId
 */
const getWorkflowInstalledPath = (bundleId: string) => {
  return path.resolve(workflowInstallPath, bundleId);
};

/**
 * @param  {string} bundleId
 */
const getPluginInstalledPath = (bundleId: string) => {
  return path.resolve(pluginInstallPath, bundleId);
};

/**
 * @param  {string} bundleId
 */
const getWorkflowConfigJsonPath = (bundleId: string) => {
  return path.resolve(getWorkflowInstalledPath(bundleId), 'arvis-workflow.json');
};

/**
 * @param  {string} bundleId
 */
const getPluginConfigJsonPath = (bundleId: string) => {
  return path.resolve(getPluginInstalledPath(bundleId), 'arvis-plugin.json');
};

export {
  tempPath,
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getExtensionCachePath,
  getExtensionDataPath,
  getExtensionHistoryPath,
  getPluginConfigJsonPath,
  getPluginInstalledPath,
  getWorkflowConfigJsonPath,
  getWorkflowInstalledPath,
  initializePath,
};

export default {
  tempPath,
  installedDataPath,
  workflowInstallPath,
  pluginInstallPath,
  getExtensionCachePath,
  getExtensionDataPath,
  getPluginConfigJsonPath,
  getPluginInstalledPath,
  getWorkflowConfigJsonPath,
  getWorkflowInstalledPath,
  initializePath,
};
