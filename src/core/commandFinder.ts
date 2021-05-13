import { getCommandList } from './commandList';
import { getWorkflowList } from './workflowList';

/**
 * @param  {string} inputStr
 */
const findCommands = (inputStr: string) => {
  const commands = getCommandList();

  const searchResult = [] as any;
  for (const commandStr of Object.keys(commands)) {
    // e.g when given inputStr is 'en abc' => output: en
    const isBackwardCandidates =
      inputStr.split(commandStr).length > 1 && inputStr.startsWith(commandStr + ' ');
    // e.g. when given inputStr is 'en' => output: en, enc, enct..
    const isForwardCandidates = commandStr.startsWith(inputStr.trimRight());

    if (isForwardCandidates || isBackwardCandidates) {
      for (const command of commands[commandStr]) {
        const { bundleId } = command;
        const { defaultIcon, enabled, arg_type } = getWorkflowList()[bundleId];

        // Except if arg_type is no and query exists
        if (arg_type === 'no' && inputStr !== commandStr) {
          break;
        }

        if (enabled) {
          command.icon = {
            path: defaultIcon,
          };
          searchResult.push(command);
        }
      }
    }
  }

  return searchResult;
};

export { findCommands };
