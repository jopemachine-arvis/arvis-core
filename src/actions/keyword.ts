import { getPluginList, getWorkflowList, WorkManager } from '../core';

/**
 * @param  {KeywordAction} item
 * @description Used in only keyword action, not keyword trigger.
 *              (Because keyword trigger is immediately executed)
 */
const handleKeywordAction = (item: KeywordAction) => {
  const workManager = WorkManager.getInstance();

  const infolist =
    workManager.extensionInfo!.type === 'workflow'
      ? getWorkflowList()
      : getPluginList();

  const defaultIcon = infolist[workManager.getTopWork().bundleId].defaultIcon;

  workManager.onItemShouldBeUpdate &&
    workManager.onItemShouldBeUpdate({
      items: [
        {
          title: item.title ?? '',
          subtitle: item.subtitle ?? '',
          bundleId: workManager.getTopWork().bundleId,
          icon: {
            path: defaultIcon,
          },
        },
      ],
      needIndexInfoClear: true,
    });
};

export { handleKeywordAction };
