import fse from 'fs-extra';
import { userConfigPath } from './path';

/**
 * @description Migrate previous extenion's setting
 */
const applyUserConfigs = (userConfig: any, extensionInfo: any) => {
  const result = { ...extensionInfo };

  // Migrate previous variables
  if (userConfig.variables) {
    for (const variable of Object.keys(userConfig.variables)) {
      result.variables[variable] = userConfig.variables[variable];
    }
  }

  return result;
};

const getUserConfigs = async () => {
  return fse.readJSON(userConfigPath);
};

const addUserConfigs = async (bundleId: string, type: 'variables', target: any) => {
  const userConfigs = await getUserConfigs();

  if (!userConfigs[bundleId]) userConfigs[bundleId] = {};

  userConfigs[bundleId][type] = target;
  await fse.writeJSON(userConfigPath, userConfigs, { encoding: 'utf-8' });
};

const initialzeUserConfigs = async () => {
  await fse.remove(userConfigPath);
  await fse.writeJSON(userConfigPath, {});
};

export {
  addUserConfigs,
  applyUserConfigs,
  initialzeUserConfigs,
  getUserConfigs
};