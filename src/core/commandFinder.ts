import { getCommandList } from './commandList';
import { getWorkflowList } from './workflowList';

/**
 * @param  {string} inputStr
 */
const findCommands = (inputStr: string) => {
  const commands = getCommandList();

  const searchResult = [] as any;
  for (const commandStr of Object.keys(commands)) {
    // Same search result, no matter how many whitespace is attached to the right of command.
    if (commandStr.startsWith(inputStr.trimRight())) {
      for (const command of commands[commandStr]) {
        const { bundleId } = command;
        const { defaultIcon, enabled } = getWorkflowList()[bundleId];

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
