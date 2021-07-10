import { ActionFlowManager } from '../core/actionFlowManager';

/**
 * @param  {string} newInput
 */
export const handleResetInputAction = (newInput: string): void => {
  const actionFlowManager = ActionFlowManager.getInstance();
  actionFlowManager.clearTriggerStk();
  actionFlowManager.onInputShouldBeUpdate!({
    needItemsUpdate: true,
    str: newInput,
  });
};
