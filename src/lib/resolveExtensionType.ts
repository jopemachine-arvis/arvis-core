import { ActionFlowManager } from '../core/actionFlowManager';

export const resolveExtensionType = (command?: Command): 'workflow' | 'plugin' => {
  const actionFlowManager = ActionFlowManager.getInstance();
  if (actionFlowManager.hasEmptyTriggerStk()) {
    if (!command) throw new Error('Command must be given when trigger stack is empty.');
    if (command.isPluginItem) {
      return 'plugin';
    }
    return 'workflow';
  } else {
    return actionFlowManager.extensionInfo!.type;
  }
};
