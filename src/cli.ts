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
      let bundleId: string | undefined;
      let wfConfigFilePath: string | undefined;
      if (input[1].endsWith(".json")) {
        bundleId = input[1];
      } else {
        wfConfigFilePath = input[1];
      }
      await unInstall({ storeType: StoreType.CUI, bundleId, wfConfigFilePath });
      break;
  }

  return '';
};

export {
  cliFunc,
  helpManual
};