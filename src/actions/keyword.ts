import {
  ActionFlowManager,
  getPluginList,
  getWorkflowList,
  Renderer,
  resolveExtensionType,
} from '../core';

/**
 * Used in only keyword action, not keyword trigger.
 * (Because keyword trigger is immediately executed)
 * @param item
 */
export const handleKeywordAction = (item: KeywordAction): void => {
  const actionFlowManager = ActionFlowManager.getInstance();

  const infolist: Record<string, any> = resolveExtensionType() === 'workflow'
    ? getWorkflowList()
    : getPluginList();

  const defaultIcon = infolist[actionFlowManager.getTopTrigger().bundleId].defaultIcon;

  Renderer.onItemShouldBeUpdate({
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
