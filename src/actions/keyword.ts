import { getWorkflowList, WorkManager } from '../core';


/**
 * @param  {KeywordAction} targetAction
 * @param  {object} args
 * @description Used in only keyword action, not keyword trigger.
 *              Keyword action needs to wait for user input.
 */
const handleKeywordWaiting = (
  trigger: Command | PluginItem | ScriptFilterItem,
  targetAction: KeywordAction,
  args: object
): boolean => {
  if (targetAction.type !== 'keyword') return false;
  const workManager = WorkManager.getInstance();

  // Assume nested keyword not happen
  if (
    workManager.getTopWork().type !== 'keyword' &&
    workManager.getTopWork().type !== 'keyword-waiting'
  ) {
    const nextAction = targetAction;
    workManager.pushWork({
      type: 'keyword-waiting',
      args,
      input: '',
      action: [nextAction],
      actionTrigger: trigger,
      bundleId: workManager.getTopWork().bundleId,
    });

    setKeywordItem(nextAction as KeywordAction);

    workManager.onItemPressHandler && workManager.onItemPressHandler();
    workManager.onInputShouldBeUpdate &&
      workManager.onInputShouldBeUpdate({
        str: '',
        needItemsUpdate: false,
      });
    return true;
  }
  return false;
};

/**
 * @param  {KeywordAction} item
 * @description Used in only keyword action, not keyword trigger.
 */
const setKeywordItem = (item: KeywordAction) => {
  const workManager = WorkManager.getInstance();

  // To do :: If this code could be used in plugin, below codes need to be fixed.
  const workflowDefaultIcon =
    getWorkflowList()[workManager.getTopWork().bundleId].defaultIcon;

  workManager.onItemShouldBeUpdate &&
    workManager.onItemShouldBeUpdate({
      items: [
        {
          title: item.title ?? '',
          subtitle: item.subtitle ?? '',
          bundleId: workManager.getTopWork().bundleId,
          icon: {
            path: workflowDefaultIcon,
          },
        },
      ],
      needIndexInfoClear: true,
    });
};

export { handleKeywordWaiting, setKeywordItem };
