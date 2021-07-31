import { ActionFlowManager } from '../core/actionFlowManager';

/**
 * Users can quit scriptfilters anytime they want.
 * If the async function was running in the middle, the script filter might have be quitted after the async function was returned.
 * This function would be used for wrapping these async functions.
 */
export const exitify = (asyncFunc: any) => async (...args: any[]): Promise<{
  exit: boolean;
  value: any;
}> => {
  let exit = false;
  const value = await asyncFunc(...args);

  const actionFlowManager = ActionFlowManager.getInstance();
  if (actionFlowManager.hasEmptyTriggerStk()) {
    exit = true;
  }

  return {
    exit,
    value,
  };
};