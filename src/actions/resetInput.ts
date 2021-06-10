import { WorkManager } from '../core/workManager';

/**
 * @param  {string} newInput
 */
export const handleResetInputAction = (newInput: string) => {
  const workManager = WorkManager.getInstance();
  workManager.clearWorkStack();
  workManager.onInputShouldBeUpdate!({
    needItemsUpdate: true,
    str: newInput,
  });
};
