import alphaSort from 'alpha-sort';
import _ from 'lodash';
import { getHistory } from '../config/history';
import { getCommandList } from './commandList';
import { pluginWorkspace } from './pluginWorkspace';
import { getWorkflowList } from './workflowList';

/**
 * @param inputStr
 */
const findPluginCommands = async (inputStr: string): Promise<{
  pluginOutputs: PluginItem[],
  pluginFallbackOutputs: PluginItem[]
}> => {
  pluginWorkspace.executingAsyncPlugins = true;

  const pluginExecutionResults = await pluginWorkspace.search(inputStr);
  const [pluginFallbackItems, pluginItems] = _.partition(
    pluginExecutionResults,
    (result) => result.noSort
  );

  const pluginOutputs: PluginItem[] = pluginItems
    .map((result) => result.items)
    .reduce((prev, curr) => [...prev, ...curr], [])
    .sort((a, b) =>
      a.stringSimilarity! > b.stringSimilarity! ? -1 : 1
    );

  const pluginFallbackOutputs: PluginItem[] = pluginFallbackItems
    .map((result) => result.items)
    .reduce((prev, curr) => [...prev, ...curr], []);

  pluginWorkspace.executingAsyncPlugins = false;

  return {
    pluginOutputs,
    pluginFallbackOutputs,
  };
};

/**
 * If inputStr is '', return no commands.
 * If inputStr is undefined, return all commands.
 * @param inputStr
 */
const findWorkflowCommands = (inputStr?: string): Command[] => {
  const commands = getCommandList();

  if (inputStr === '') return [];
  // If there are no argument, find all commands
  else if (!inputStr) inputStr = '';

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

    const same = isBackwardCandidates && isForwardCandidates;

    if (isForwardCandidates || isBackwardCandidates) {
      for (const command of commands[commandStr]) {
        const { type, bundleId, argType, withspace } = command;
        const { defaultIcon, enabled } = getWorkflowList()[bundleId!];

        // Exclude when withspace is 'true' and not satisfy the condition
        const isWithspaceButNotHaveWhitespace =
          isBackwardCandidates &&
          type === 'scriptFilter' &&
          withspace &&
          !same &&
          !inputStr.startsWith(commandStr + ' ');

        // Exclude when argType is 'no' and query exists
        const argTypeIsNoButHasQuery =
          isBackwardCandidates &&
          argType === 'no' &&
          inputStr !== commandStr;

        if (
          argTypeIsNoButHasQuery ||
          isWithspaceButNotHaveWhitespace
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
const sortByLatestUse = (targets: Command[] | PluginItem[], logDict?: Map<string, number>): Command[] | PluginItem[] => {
  if (targets.length <= 0) return [];
  if (!logDict) {
    logDict = getLogDict();
  }

  const compareTarget = targets[0]['isPluginItem'] ? 'title' : 'command';

  return targets.sort((a: Command | PluginItem, b: Command | PluginItem) => {
    const aP = logDict!.has(a[compareTarget]!) ? logDict!.get(a[compareTarget]!) : -1;
    const bP = logDict!.has(b[compareTarget]!) ? logDict!.get(b[compareTarget]!) : -1;
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
): Promise<{ items: (Command | PluginItem)[] }> => {
  if (inputStr === '') {
    return {
      items: [],
    };
  }

  const workflowCommands = findWorkflowCommands(inputStr);

  const { pluginFallbackOutputs, pluginOutputs } = await findPluginCommands(
    inputStr
  );

  const logDict = getLogDict();

  return {
    items: [
      ...sortByLatestUse(workflowCommands, logDict),
      ...sortByLatestUse(pluginOutputs, logDict),
      ...sortByLatestUse(pluginFallbackOutputs, logDict),
    ],
  };
};

export { findCommands, findWorkflowCommands, findPluginCommands, sortByLatestUse };
