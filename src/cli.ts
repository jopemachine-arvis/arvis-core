import chalk from 'chalk';
import {
  install,
  execute,
  findCommands,
  unInstall,
  getWorkflowList,
  getCommandList,
} from "./core";

import initConfig from './config/initConfig';
import helpManual from './config/helpStr';

// cli main function
const cliFunc = async (input, flags): Promise<string> => {
  switch (input[0]) {
    case "init":
      initConfig();
      return chalk.cyan('Init config completed.');
    case "l":
    case "list":
      return getWorkflowList();
    case "f":
    case "find":
      return findCommands(input[1]);
    case "i":
    case "install":
      await install(input[1]);
      break;
    case "c":
    case "commands":
      return getCommandList();
    case "un":
    case "uninstall":
      await unInstall(input[1]);
      break;
  }

  return '';
};

export {
  cliFunc,
  helpManual
};