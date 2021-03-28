import { cliFunc } from './cli';
import meow from "meow";
import getHelpStr from "./config/getHelpStr";

const cli: meow.Result<meow.AnyFlags> = meow(getHelpStr('wf-creator-core'), {});

(async () => {
  console.log(await cliFunc(cli.input, cli.flags));
}) ();