import { execute } from "../actions/scriptExecution";
import { handleScriptArgs } from './argsHandler';
import "../types";

const handleScriptFilterChange = (
  bundleId: string,
  command: Command,
  queryArgs: object
) => {
  const script = command.script_filter!;
  return execute(bundleId, handleScriptArgs(script, queryArgs));
};

export {
  handleScriptFilterChange,
};