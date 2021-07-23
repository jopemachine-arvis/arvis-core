import { Store } from '../config/store';
import { getWorkflowList } from './workflowList';

/**
 * Find available workflow hotkeys
 * @returns hotkeys
 */
export const findHotkeys = (): Record<string, Command> => {
  const store = Store.getInstance();
  const allHotkeys = store.getHotkeys();

  const retrieveResult = {};
  for (const hotkey of Object.keys(allHotkeys)) {
    const hotkeyInfo = allHotkeys[hotkey];
    const { enabled } = getWorkflowList()[hotkeyInfo.bundleId!];

    if (enabled) {
      retrieveResult[hotkey] = hotkeyInfo;
    }
  }

  return retrieveResult;
};
