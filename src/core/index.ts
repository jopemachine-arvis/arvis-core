import { handleAction } from './actionHandler';
import {
  hasRequiredArg,
  isArgTypeNoButHaveArg,
  isInputMeetWithspaceCond,
} from './argUtility';
import { checkUpdatableExtensions } from './checkUpdatableExtensions';
import { findCommands } from './commandFinder';
import { getCommandList } from './commandList';
import { decideExtensionType } from './decideExtensionType';
import { findTriggers } from './findTriggers';
import { getBundleId, getNameFromBundleId } from './getBundleId';
import { getSystemPaths } from './getSystemPaths';
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
import {
  xmlExtractGlobalVars,
  xmlScriptFilterItemToJsonScriptFilterItem,
  xmlToJsonScriptFilterItemFormat,
} from './scriptFilterItemFormatConverter';
import { setAsyncPluginTimer } from './setAsyncPluginTimer';
import { setExternalEnvs } from './setExternalEnvs';
import { setStoreAvailabiltyChecker } from './setStoreAvailabiltyChecker';
import { getTriggers } from './triggerList';
import { exportWorkflow } from './workflowExporter';
import {
  install as installWorkflow,
  unInstall as uninstallWorkflow,
} from './workflowInstaller';
import { getWorkflowList } from './workflowList';
import { renewWorkflows } from './workflowRenewer';
import { updateWorkflowTrigger } from './workflowTriggerUpdater';
import { WorkManager } from './workManager';

import { Store } from '../config';
import { setMacPathsEnv } from '../config/envHandler';
import * as history from '../config/history';
import * as logger from '../config/logger';
import * as path from '../config/path';
import { addUserConfigs, applyUserConfigs, getUserConfigs, initialzeUserConfigs } from '../config/userConfig';

import { registerCustomAction, scriptFilterExcute } from '../actions';

export {
  addUserConfigs,
  applyUserConfigs,
  checkUpdatableExtensions,
  decideExtensionType,
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
  scriptFilterExcute,
  setAsyncPluginTimer,
  setExternalEnvs,
  setMacPathsEnv,
  setStoreAvailabiltyChecker,
  Store,
  uninstallPlugin,
  uninstallWorkflow,
  updateWorkflowTrigger,
  WorkManager,
  xmlExtractGlobalVars,
  xmlScriptFilterItemToJsonScriptFilterItem,
  xmlToJsonScriptFilterItemFormat,
};
