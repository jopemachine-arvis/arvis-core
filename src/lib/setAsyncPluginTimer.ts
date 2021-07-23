import { pluginWorkspace } from '../core/pluginWorkspace';

/**
 * @param timer
 */
export const setAsyncPluginTimer = (timer: number): void => {
  pluginWorkspace.setAsyncPluginTimer(timer);
};
