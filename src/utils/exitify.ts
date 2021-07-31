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
  const actionFlowManager = ActionFlowManager.getInstance();
  const prevHasEmptyTriggerStk = actionFlowManager.hasEmptyTriggerStk();

  const value = await asyncFunc(...args);

  if (!prevHasEmptyTriggerStk && actionFlowManager.hasEmptyTriggerStk()) {
    exit = true;
  }

  return {
    exit,
    value,
  };
};