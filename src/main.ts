import meow from 'meow';
import { cliFunc } from './cli';
import getHelpStr from './config/getHelpStr';

const cli: meow.Result<meow.AnyFlags> = meow(getHelpStr('arvis-core'), {});

(async () => {
  console.log(await cliFunc(cli.input, cli.flags));
})();
