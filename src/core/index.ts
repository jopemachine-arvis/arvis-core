import {
  hasRequiredArg,
  isArgTypeNoButHaveArg,
  isInputMeetWithspaceCond,
} from '../lib/argUtility';
import { checkUpdatableExtensions } from '../lib/checkUpdatableExtensions';
import { getBundleId, getNameFromBundleId } from '../lib/getBundleId';
import { getClipboardText } from '../lib/getClipboardText';
import { getShellPaths } from '../lib/getShellPaths';
import { overwriteExtensionInfo } from '../lib/overwriteExtensionInfo';
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
import { findCommands, findPluginCommands, findWorkflowCommands } from './commandFinder';
import { getCommandList } from './commandList';
import { findHotkeys } from './hotkeyFinder';
import { determineDefaultIconPath, determineIconPath } from './iconPathFinder';
import { exportPlugin } from './pluginExporter';
import {
  install as installPlugin,
  unInstall as uninstallPlugin,
} from './pluginInstaller';
import { getPluginList } from './pluginList';
import { reloadPlugins } from './pluginReloader';
import { pluginWorkspace } from './pluginWorkspace';
import { endScriptExecutor, execute, setUseExecutorProcess, startScriptExecutor } from './scriptExecutor';
import { findTriggers } from './triggerFinder';
import { getTriggers } from './triggerList';
import { exportWorkflow } from './workflowExporter';
import {
  install as installWorkflow,
  unInstall as uninstallWorkflow,
} from './workflowInstaller';
import { getWorkflowList } from './workflowList';
import { reloadWorkflows } from './workflowReloader';
import { updateWorkflowTrigger } from './workflowTriggerUpdater';

import { Store } from '../config';
import { getEnvs, getExternalEnvs, getShellPathsEnv, setShellPathEnv } from '../config/envHandler';
import * as history from '../config/history';
import * as logger from '../config/logger';
import * as path from '../config/path';
import { addUserConfigs, applyUserConfigs, getUserConfigs, initialzeUserConfigs } from '../config/userConfig';
import { Renderer } from './rendererUpdater';

import { registerCustomAction, scriptFilterExcute } from '../actions';

export {
  ActionFlowManager,
  addUserConfigs,
  applyUserConfigs,
  checkUpdatableExtensions,
  determineDefaultIconPath,
  determineIconPath,
  endScriptExecutor,
  execute,
  exportPlugin,
  exportWorkflow,
  findCommands,
  findHotkeys,
  findPluginCommands,
  findTriggers,
  findWorkflowCommands,
  getBundleId,
  getClipboardText,
  getCommandList,
  getEnvs,
  getExternalEnvs,
  getNameFromBundleId,
  getPluginList,
  getShellPaths,
  getShellPathsEnv,
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
  overwriteExtensionInfo,
  path,
  pluginWorkspace,
  registerCustomAction,
  reloadPlugins,
  reloadWorkflows,
  Renderer,
  resolveExtensionType,
  scriptFilterExcute,
  setAsyncPluginTimer,
  setExternalEnvs,
  setShellPathEnv,
  setStoreAvailabiltyChecker,
  setUseExecutorProcess,
  startScriptExecutor,
  Store,
  uninstallPlugin,
  uninstallWorkflow,
  updateWorkflowTrigger,
  xmlExtractGlobalVars,
  xmlScriptFilterItemToJsonScriptFilterItem,
  xmlToJsonScriptFilterItemFormat,
};
