import chalk from 'chalk';
import {
  install,
  findCommands,
  unInstall,
  getWorkflowList,
  getCommandList,
} from "./core";

import initConfig from './config/initConfig';
import helpManual from './config/getHelpStr';

import { StoreType } from './types/storeType';

// cli main function
const cliFunc = async (input, flags): Promise<string> => {
  switch (input[0]) {
    case "init":
      initConfig();
      return chalk.cyan('Init config completed.');
    case "l":
    case "list":
      return getWorkflowList(StoreType.CUI);
    case "f":
    case "find":
      return findCommands(StoreType.CUI, input[1]);
    case "i":
    case "install":
      await install(StoreType.CUI, input[1]);
      break;
    case "c":
    case "commands":
      return getCommandList(StoreType.CUI);
    case "un":
    case "uninstall":
      await unInstall(StoreType.CUI, input[1]);
      break;
  }

  return '';
};

export {
  cliFunc,
  helpManual
};