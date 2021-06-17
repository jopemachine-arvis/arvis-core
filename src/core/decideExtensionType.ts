import { WorkManager } from './workManager';

export const decideExtensionType = (command: any) => {
  const workManager = WorkManager.getInstance();
  if (workManager.hasEmptyWorkStk()) {
    if (command.isPluginItem) {
      return 'plugin';
    }
    return 'workflow';
  } else {
    return workManager.extensionInfo!.type;
  }
};
