import { execute } from "../actions/scriptExecution";
import { handleScriptArgs } from './argsHandler';
import { escapeBraket } from '../utils';
import "../types";

const handleScriptFilterChange = (
  bundleId: string,
  command: Command,
  queryArgs: object
) => {
  const script = command.script_filter!.split(' ').map((str: string) => {
    return escapeBraket(str);
  }).join(' ');

  const scriptStr = handleScriptArgs({ str: script, queryArgs });

  console.log(`Script to execute.. '${scriptStr}'`);

  return execute(bundleId, scriptStr);
};

export {
  handleScriptFilterChange,
};