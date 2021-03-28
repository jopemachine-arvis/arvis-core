import { execute } from "../actions/scriptExecution";
import { handleScriptArgs } from './argsHandler';

const handleScriptFilter = (command, queryArgs: object) => {
  const script = command.script_filter;
  return execute(
    command.bundleId,
    handleScriptArgs(script, queryArgs)
  );
};

export {
  handleScriptFilter,
};