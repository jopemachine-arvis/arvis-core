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

  return execute(bundleId, handleScriptArgs(script, queryArgs));
};

export {
  handleScriptFilterChange,
};