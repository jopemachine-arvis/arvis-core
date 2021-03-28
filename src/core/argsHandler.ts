import { replaceAll } from '../utils';

const handleScriptArgs = (str: string, queryArgs: object) => {
  for (const key of Object.keys(queryArgs)) {
    str = replaceAll(str, key, queryArgs[key]);
  }
  return str;
};

const extractArgs = (querys: string[]) => {
  // To do:: In some cases, the single quotes below may need to be escape.
  const args = { "'{query}'": querys.join(" "), $1: "" };

  // tslint:disable-next-line: forin
  for (const qIdx in querys) {
    // * Assign args separated by whitespace to each index.
    args[`$${Number(qIdx) + 1}`] = querys[qIdx];
  }

  return args;
};

const extractArgsFromScriptFilterItem = (item: ScriptFilterItem) => {
  return {
    "'{query}'": item.arg,
    $1: item.arg,
  };
};

export {
  extractArgs,
  extractArgsFromScriptFilterItem,
  handleScriptArgs
};
