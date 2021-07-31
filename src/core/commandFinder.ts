import alphaSort from 'alpha-sort';
import _ from 'lodash';
import PCancelable from 'p-cancelable';
import { getHistory } from '../config/history';
import { getCommandList } from './commandList';
import { pluginWorkspace } from './pluginWorkspace';
import { getWorkflowList } from './workflowList';

/**
 * @param inputStr
 */
const findPluginCommands = async (inputStr: string): Promise<{
  pluginSortOutputs: PluginItem[],
  pluginNoSortOutputs: PluginItem[]
  unresolvedItems: PCancelable<PluginExectionResult>[]
}> => {
  const { pluginExecutionResults, unresolvedPlugins } = await pluginWorkspace.search(inputStr);
  const [pluginNoSortItems, pluginItems] = _.partition(
    pluginExecutionResults,
    (result) => result.noSort
  );

  const pluginSortOutputs: PluginItem[] = pluginItems
    .map((result) => result.items)
    .reduce((prev, curr) => [...prev, ...curr], [])
    .sort((a, b) =>
      a.stringSimilarity! > b.stringSimilarity! ? -1 : 1
    );

  const pluginNoSortOutputs: PluginItem[] = pluginNoSortItems
    .map((result) => result.items)
    .reduce((prev, curr) => [...prev, ...curr], []);

  return {
    pluginSortOutputs,
    pluginNoSortOutputs,
    unresolvedItems: unresolvedPlugins
  };
};

/**
 * @param inputStr
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
        const { defaultIcon, enabled } = getWorkflowList()[bundleId!];

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
 * @param targets
 * @param logDict
 */
const sortByLatestUse = (targets: Command[] | PluginItem[], logDict: Map<string, number>): Command[] | PluginItem[] => {
  if (targets.length <= 0) return [];
  const compareTarget = targets[0]['isPluginItem'] ? 'title' : 'command';

  return targets.sort((a: Command | PluginItem, b: Command | PluginItem) => {
    const aP = logDict.has(a[compareTarget]!) ? logDict.get(a[compareTarget]!) : -1;
    const bP = logDict.has(b[compareTarget]!) ? logDict.get(b[compareTarget]!) : -1;
    return aP! > bP! ? -1 : 1;
  });
};

/**
 */
const getLogDict = (): Map<string, number> => {
  const logDict = new Map<string, number>();

  getHistory().forEach((log: Log, index: number) => {
    if (log.type === 'query') {
      logDict.set(log.inputStr!, index);
    }
  });

  return logDict;
};

/**
 * Return commands containing inputStr and plugin execution results
 * workflowItem has higher display priority than pluginItem
 * @param inputStr
 */
const findCommands = async (
  inputStr: string
): Promise<{ items: (Command | PluginItem)[], unresolved: PCancelable<PluginExectionResult>[] }> => {
  if (inputStr === '') {
    return {
      items: [],
      unresolved: []
    };
  }

  const workflowCommands = await findWorkflowCommands(inputStr);
  const { pluginNoSortOutputs, pluginSortOutputs, unresolvedItems } = await findPluginCommands(
    inputStr
  );

  const logDict = getLogDict();

  return {
    items: [
      ...sortByLatestUse(workflowCommands, logDict),
      ...sortByLatestUse(pluginSortOutputs, logDict),
      ...sortByLatestUse(pluginNoSortOutputs, logDict),
    ],
    unresolved: unresolvedItems,
  };
};

export { findCommands, findWorkflowCommands, findPluginCommands };
