import {
  install,
  execute,
  findCommands,
  unInstall,
  getWorkflowList,
  getCommandList,
} from "./core";
import helpManual from './config/helpStr';

// cli main function
const cliFunc = async (input, flags): Promise<string> => {
  switch (input[0]) {
    case "l":
    case "list":
      return getWorkflowList();
    case "e":
    case "execute":
      const pipedStr = await execute(input[1]);
      return pipedStr;
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