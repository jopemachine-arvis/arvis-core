import meow from "meow";
import helpStr from "./config/helpStr";
import {
  install,
  execute,
  findCommands,
  unInstall,
  getWorkflowList,
  getCommandList,
} from "./core";

const cli: meow.Result<meow.AnyFlags> = meow(helpStr, {});

// cli main function
(async (input, flags) => {
  switch (input) {
    case "l":
    case "list":
      console.log(getWorkflowList());
      break;
    case "e":
    case "execute":
      const pipedStr = await execute(cli.input[1]);
      console.log(pipedStr);
      break;
    case "f":
    case "find":
      console.log(findCommands(cli.input[1]));
      break;
    case "i":
    case "install":
      await install(cli.input[1]);
      break;
    case "c":
    case "commands":
      console.log(getCommandList());
      break;
    case "un":
    case "uninstall":
      await unInstall(cli.input[1]);
      break;
  }
})(cli.input[0], cli.flags);
