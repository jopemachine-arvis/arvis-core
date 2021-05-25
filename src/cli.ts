import {
  findCommands,
  findHotkeys,
  getCommandList,
  getWorkflowList,
  installPlugin,
  installWorkflow,
  uninstallPlugin,
  uninstallWorkflow,
} from './core';

import helpManual from './config/getHelpStr';

/**
 * @param  {string[]} input
 * @param  {any} flags
 * @summary cli main function
 */
const cliFunc = async (input: string[], flags: any): Promise<string> => {
  switch (input[0]) {
    case 'l':
    case 'list':
      return getWorkflowList();
    case 'f':
    case 'find':
      return findCommands(input[1]).toString();
    case 'install-plugin':
      await installPlugin(input[1]);
      break;
    case 'install-workflow':
      await installWorkflow(input[1]);
      break;
    case 'c':
    case 'commands':
      return getCommandList().toString();
    case 'h':
    case 'hotkeys':
      return findHotkeys();
    case 'uninstall-workflow':
      await uninstallWorkflow({ bundleId: input[1] });
    case 'uninstall-plugin':
      await uninstallPlugin({ bundleId: input[1] });
      break;
  }

  return '';
};

export { cliFunc, helpManual };
