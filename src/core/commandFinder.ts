import { getCommandList } from './commandList';
import { pluginWorkspace } from './pluginWorkspace';
import { getWorkflowList } from './workflowList';

/**
 * @param  {string} inputStr
 * @return {(Command | PluginItem)[]}
 * @description Return commands containing inputStr and plugin execution results
 *              workflowItem has higher display priority than pluginItem
 */
const findCommands = async (
  inputStr: string
): Promise<(Command | PluginItem)[]> => {
  const commands = getCommandList();

  if (inputStr === '') return [];

  const searchResult = [] as any;
  for (const commandStr of Object.keys(commands)) {
    // e.g when given inputStr is 'en abc' => output: en
    const isBackwardCandidates = inputStr.startsWith(commandStr);

    // e.g. when given inputStr is 'en' => output: en, enc, enct..
    const isForwardCandidates = commandStr.startsWith(inputStr.trimRight());

    if (isForwardCandidates || isBackwardCandidates) {
      for (const command of commands[commandStr]) {
        const { bundleId, arg_type } = command;
        const { defaultIcon, enabled } = getWorkflowList()[bundleId];

        // Except if arg_type is 'no' and query exists
        if (
          arg_type === 'no' &&
          isBackwardCandidates &&
          inputStr !== commandStr
        ) {
          break;
        }

        if (enabled) {
          searchResult.push({
            ...command,
            icon: {
              path: defaultIcon,
            },
          });
        }
      }
    }
  }

  return [...searchResult, ...(await pluginWorkspace.search(inputStr))];
};

export { findCommands };
