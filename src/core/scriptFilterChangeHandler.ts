import { execute } from "../actions/scriptExecution";
import { handleScriptArgs } from './argsHandler';
import "../types";

const handleScriptFilterChange = (command: Command, queryArgs: object) => {
  const script = command.script_filter!;
  return execute(
    command.bundleId!,
    handleScriptArgs(script, queryArgs)
  );
};

export {
  handleScriptFilterChange,
};