import meow from "meow";
import helpStr from "./config/helpStr";

const flags: meow.AnyFlags = {};

const cli: meow.Result<meow.AnyFlags> = meow(helpStr, { flags });

// cli main function
((input, flags) => {
  switch (input) {
    case "i":
    case "install":
      break;
    case "un":
    case "uninstall":
      break;
  }
})(cli.input[0], cli.flags);
