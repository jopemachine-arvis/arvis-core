import { execute } from "./scriptExecution";
import { replaceAll } from '../utils';

const handleScriptArgs = (script: string, queryArgs) => {
  for (const key of Object.keys(queryArgs)) {
    script = replaceAll(script, key, queryArgs[key]);
  }
  return script;
};

const handleScriptFilter = (command, queryArgs) => {
  const script = command.script_filter;
  return execute(
    command.bundleId,
    handleScriptArgs(script, queryArgs)
  );
};

export {
  handleScriptFilter,
};