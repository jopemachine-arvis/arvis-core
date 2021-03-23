import { cliFunc } from './cli';
import meow from "meow";
import helpStr from "./config/helpStr";

const cli: meow.Result<meow.AnyFlags> = meow(helpStr, {});

(async () => {
  console.log(await cliFunc(cli.input, cli.flags));
}) ();