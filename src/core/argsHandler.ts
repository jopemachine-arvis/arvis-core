import { replaceAll } from '../utils';

const handleScriptArgs = (str: string, queryArgs: object) => {
  for (const key of Object.keys(queryArgs)) {
    str = replaceAll(str, key, queryArgs[key]);
  }
  return str;
};

const createArgs = (querys: string[]) => {
  const args = { "{query}": querys.join(" "), $1: "" };

  // tslint:disable-next-line: forin
  for (const qIdx in querys) {
    // * Assign args separated by whitespace to each index.
    args[`$${Number(qIdx) + 1}`] = querys[qIdx];
  }

  return args;
};

export {
  createArgs,
  handleScriptArgs
};
