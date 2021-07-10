import { ActionFlowManager, getPluginList, getWorkflowList } from '../core';

/**
 * @param  {KeywordAction} item
 * @description Used in only keyword action, not keyword trigger.
 *              (Because keyword trigger is immediately executed)
 */
const handleKeywordAction = (item: KeywordAction): void => {
  const actionFlowManager = ActionFlowManager.getInstance();

  const infolist =
    actionFlowManager.extensionInfo!.type === 'workflow'
      ? getWorkflowList()
      : getPluginList();

  const defaultIcon = infolist[actionFlowManager.getTopTrigger().bundleId].defaultIcon;

  actionFlowManager.onItemShouldBeUpdate &&
    actionFlowManager.onItemShouldBeUpdate({
      items: [
        {
          title: item.title ?? '',
          subtitle: item.subtitle ?? '',
          bundleId: actionFlowManager.getTopTrigger().bundleId,
          icon: defaultIcon,
        },
      ],
      needIndexInfoClear: true,
    });
};

export { handleKeywordAction };
