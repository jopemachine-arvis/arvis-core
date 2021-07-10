import alphaSort from 'alpha-sort';
import _ from 'lodash';
import { getCommandList } from './commandList';
import { pluginWorkspace } from './pluginWorkspace';
import { getWorkflowList } from './workflowList';

/**
 * @param  {string} inputStr
 */
const findPluginCommands = async (inputStr: string): Promise<any> => {
  const pluginResults = await pluginWorkspace.search(inputStr);
  const [pluginNoSortItems, pluginItems] = _.partition(
    pluginResults,
    (result) => result.noSort
  );

  const pluginSortOutputs = pluginItems
    .map((result) => result.items)
    .reduce((prev, curr) => [...prev, ...curr], []);

  const pluginNoSortOutputs = pluginNoSortItems
    .map((result) => result.items)
    .reduce((prev, curr) => [...prev, ...curr], []);

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

  const searchResult: any[] = [];

  // e.g when given inputStr is 'ent' => output order: entodo, ent
  // because if order is not reversed, ent is scriptfilter, entodo is not available.
  const targetCommands = Object.keys(commands).sort(
    alphaSort({ descending: true, natural: true })
  );

  for (const commandStr of targetCommands) {
    // e.g when given inputStr is 'en abc' => output: en
    const isBackwardCandidates = inputStr.startsWith(commandStr);

    // e.g. when given inputStr is 'en' => output: en, enc, enct..
    const isForwardCandidates = commandStr.startsWith(inputStr);

    // const same = isBackwardCandidates && isForwardCandidates;

    if (isForwardCandidates || isBackwardCandidates) {
      for (const command of commands[commandStr]) {
        const { bundleId, argType } = command;
        const { defaultIcon, enabled } = getWorkflowList()[bundleId];

        // Except if argType is 'no' and query exists
        if (
          argType === 'no' &&
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
  const { pluginNoSortOutputs, pluginSortOutputs } = await findPluginCommands(
    inputStr
  );

  return [
    ...workflowCommands,
    ...pluginSortOutputs.sort((a, b) =>
      a.stringSimilarity! > b.stringSimilarity! ? -1 : 1
    ),
    ...pluginNoSortOutputs,
  ];
};

export { findCommands, findWorkflowCommands, findPluginCommands };
