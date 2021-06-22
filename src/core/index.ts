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
import { exportWorkflow } from './workflowExporter';
import {
  install as installWorkflow,
  unInstall as uninstallWorkflow,
} from './workflowInstaller';
import { getWorkflowList } from './workflowList';
import { renewWorkflows } from './workflowRenewer';
import { WorkManager } from './workManager';

import { Store } from '../config';
import { setMacPathsEnv } from '../config/envHandler';
import * as history from '../config/history';
import * as logger from '../config/logger';
import * as path from '../config/path';

import { registerCustomAction, scriptFilterExcute } from '../actions';

export {
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
  getWorkflowList,
  handleAction,
  isArgTypeNoButHaveArg,
  hasRequiredArg,
  history,
  installPlugin,
  installWorkflow,
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
  WorkManager,
  xmlExtractGlobalVars,
  xmlScriptFilterItemToJsonScriptFilterItem,
  xmlToJsonScriptFilterItemFormat,
};
