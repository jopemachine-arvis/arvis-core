import { execute } from '../actions/scriptExecution';
import '../types';
import { escapeBraket } from '../utils';
import { applyArgsToScript } from './argsHandler';

type ScriptFilterChangeHandlerOption = {
  timeout?: number;
};

const handleScriptFilterChange = (
  bundleId: string,
  command: Command,
  queryArgs: object,
  options?: ScriptFilterChangeHandlerOption,
) => {
  const script = command
    .script_filter!.split(' ')
    .map((str: string) => {
      return escapeBraket(str);
    })
    .join(' ');

  const scriptStr = applyArgsToScript({ str: script, queryArgs });

  console.log(`# Scriptfilter script: '${scriptStr}'`);

  return execute(bundleId, scriptStr, options);
};

export { handleScriptFilterChange };
