import _ from 'lodash';
import { compareTwoStrings } from 'string-similarity';
import { getCommandList } from './commandList';
import { pluginWorkspace } from './pluginWorkspace';
import { getWorkflowList } from './workflowList';

/**
 * @param  {string} inputStr
 */
const findPluginCommands = async (inputStr: string) => {
  const pluginResults = await pluginWorkspace.search(inputStr);
  const [pluginNoSortItems, pluginItems] = _.partition(pluginResults, (result) => result.noSort);

  const pluginSortOutputs = pluginItems
    .map((result) => result.items)
    .reduce((prev, curr) => {
      prev.push(...curr);
      return prev;
    }, []);

  const pluginNoSortOutputs = pluginNoSortItems
    .map((result) => result.items)
    .reduce((prev, curr) => {
      prev.push(...curr);
      return prev;
    }, []);

  return {
    pluginSortOutputs,
    pluginNoSortOutputs,
  };
};

/**
 * @param  {string} inputStr
 */
const findWorkflowCommands = async (inputStr: string): Promise<Command[]> => {
  const commands = getCommandList();

  if (inputStr === '') return [];

  const searchResult = [] as any;

  const getWorkflowCommandPriority = (commandStr: string) => {
    // + 1 to set more high priority on Workflow command than plugin command.
    return compareTwoStrings(commandStr, inputStr) + 1;
  };

  for (const commandStr of Object.keys(commands)) {
    // e.g when given inputStr is 'en abc' => output: en
    const isBackwardCandidates = inputStr.startsWith(commandStr);

    // e.g. when given inputStr is 'en' => output: en, enc, enct..
    const isForwardCandidates = commandStr.startsWith(inputStr);

    const same = isBackwardCandidates && isForwardCandidates;

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
            stringSimilarity: getWorkflowCommandPriority(commandStr),
            icon: {
              path: defaultIcon,
            },
          });
        }
      }
    }
  }

  return searchResult;
};

/**
 * @param  {string} inputStr
 * @return {(Command | PluginItem)[]}
 * @description Return commands containing inputStr and plugin execution results
 *              workflowItem has higher display priority than pluginItem
 */
const findCommands = async (
  inputStr: string
): Promise<(Command | PluginItem)[]> => {
  const workflowCommands = await findWorkflowCommands(inputStr);
  const { pluginNoSortOutputs, pluginSortOutputs } = await findPluginCommands(inputStr);

  return [
    ...[...workflowCommands, ...pluginSortOutputs].sort((a, b) =>
      a.stringSimilarity! > b.stringSimilarity! ? -1 : 1
    ),
    ...pluginNoSortOutputs,
  ];
};

export { findCommands, findWorkflowCommands, findPluginCommands };
