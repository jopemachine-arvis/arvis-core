import { execute } from '../actions/scriptExecution';
import '../types';
import { escapeBraket } from '../utils';
import { applyArgsToScript } from './argsHandler';

const handleScriptFilterChange = (
  bundleId: string,
  command: Command,
  queryArgs: object
) => {
  const script = command
    .script_filter!.split(' ')
    .map((str: string) => {
      return escapeBraket(str);
    })
    .join(' ');

  const scriptStr = applyArgsToScript({ str: script, queryArgs });

  console.log(`[scriptfilter: execute] '${scriptStr}'`);

  return execute(bundleId, scriptStr);
};

export { handleScriptFilterChange };
