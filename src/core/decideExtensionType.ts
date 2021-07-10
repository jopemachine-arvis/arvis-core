import { ActionFlowManager } from './actionFlowManager';

export const decideExtensionType = (command: Command): 'workflow' | 'plugin' => {
  const actionFlowManager = ActionFlowManager.getInstance();
  if (actionFlowManager.hasEmptyTriggerStk()) {
    if (command.isPluginItem) {
      return 'plugin';
    }
    return 'workflow';
  } else {
    return actionFlowManager.extensionInfo!.type;
  }
};
