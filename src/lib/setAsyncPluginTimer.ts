import { pluginWorkspace } from '../core/pluginWorkspace';

export const setAsyncPluginTimer = (timer: number): void => {
  pluginWorkspace.setAsyncPluginTimer(timer);
};
