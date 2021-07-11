import {
  hasRequiredArg,
  isArgTypeNoButHaveArg,
  isInputMeetWithspaceCond,
} from '../lib/argUtility';
import { checkUpdatableExtensions } from '../lib/checkUpdatableExtensions';
import { getBundleId, getNameFromBundleId } from '../lib/getBundleId';
import { getSystemPaths } from '../lib/getSystemPaths';
import { resolveExtensionType } from '../lib/resolveExtensionType';
import {
  xmlExtractGlobalVars,
  xmlScriptFilterItemToJsonScriptFilterItem,
  xmlToJsonScriptFilterItemFormat,
} from '../lib/scriptFilterItemFormatConverter';
import { setAsyncPluginTimer } from '../lib/setAsyncPluginTimer';
import { setExternalEnvs } from '../lib/setExternalEnvs';
import { setStoreAvailabiltyChecker } from '../lib/setStoreAvailabiltyChecker';
import { ActionFlowManager } from './actionFlowManager';
import { handleAction } from './actionHandler';
import { findCommands } from './commandFinder';
import { getCommandList } from './commandList';
import { findHotkeys } from './hotkeyFinder';
import { determineDefaultIconPath, determineIconPath } from './iconPathFinder';
import { exportPlugin } from './pluginExporter';
import {
  install as installPlugin,
  unInstall as uninstallPlugin,
} from './pluginInstaller';
import { getPluginList } from './pluginList';
import { renewPlugins } from './pluginRenewer';
import { execute } from './scriptExecutor';
import { findTriggers } from './triggerFinder';
import { getTriggers } from './triggerList';
import { exportWorkflow } from './workflowExporter';
import {
  install as installWorkflow,
  unInstall as uninstallWorkflow,
} from './workflowInstaller';
import { getWorkflowList } from './workflowList';
import { renewWorkflows } from './workflowRenewer';
import { updateWorkflowTrigger } from './workflowTriggerUpdater';

import { Store } from '../config';
import { getEnvs, getExternalEnvs, getMacPathsEnv, setMacPathsEnv } from '../config/envHandler';
import * as history from '../config/history';
import * as logger from '../config/logger';
import * as path from '../config/path';
import { addUserConfigs, applyUserConfigs, getUserConfigs, initialzeUserConfigs } from '../config/userConfig';

import { registerCustomAction, scriptFilterExcute } from '../actions';

export {
  ActionFlowManager,
  addUserConfigs,
  applyUserConfigs,
  checkUpdatableExtensions,
  determineDefaultIconPath,
  determineIconPath,
  execute,
  exportPlugin,
  exportWorkflow,
  findCommands,
  findHotkeys,
  findTriggers,
  getBundleId,
  getCommandList,
  getEnvs,
  getExternalEnvs,
  getMacPathsEnv,
  getNameFromBundleId,
  getPluginList,
  getSystemPaths,
  getTriggers,
  getUserConfigs,
  getWorkflowList,
  handleAction,
  hasRequiredArg,
  history,
  initialzeUserConfigs,
  installPlugin,
  installWorkflow,
  isArgTypeNoButHaveArg,
  isInputMeetWithspaceCond,
  logger,
  path,
  registerCustomAction,
  renewPlugins,
  renewWorkflows,
  resolveExtensionType,
  scriptFilterExcute,
  setAsyncPluginTimer,
  setExternalEnvs,
  setMacPathsEnv,
  setStoreAvailabiltyChecker,
  Store,
  uninstallPlugin,
  uninstallWorkflow,
  updateWorkflowTrigger,
  xmlExtractGlobalVars,
  xmlScriptFilterItemToJsonScriptFilterItem,
  xmlToJsonScriptFilterItemFormat,
};
