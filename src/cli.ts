import chalk from 'chalk';
import {
  findCommands,
  findHotkeys,
  getCommandList,
  getWorkflowList,
  install,
  unInstall,
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
    case 'i':
    case 'install':
      await install(input[1]);
      break;
    case 'c':
    case 'commands':
      return getCommandList();
    case 'h':
    case 'hotkeys':
      return findHotkeys();
    case 'un':
    case 'uninstall':
      const bundleId: string = input[1];
      await unInstall({ bundleId });
      break;
  }

  return '';
};

export { cliFunc, helpManual };
