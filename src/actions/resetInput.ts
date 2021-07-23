import { ActionFlowManager, Renderer } from '../core';

/**
 * @param newInput
 */
export const handleResetInputAction = (newInput: string): void => {
  const actionFlowManager = ActionFlowManager.getInstance();
  actionFlowManager.clearTriggerStk();
  Renderer.onInputShouldBeUpdate!({
    needItemsUpdate: true,
    str: newInput,
  });
};
