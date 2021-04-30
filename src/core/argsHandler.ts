import { escapeBraket, replaceAll } from '../utils';

const handleScriptArgs = ({
  str,
  queryArgs,
  appendQuotes,
}: {
  str: string;
  queryArgs: object;
  appendQuotes?: boolean;
}) => {
  for (const key of Object.keys(queryArgs)) {
    const newStr =
      appendQuotes === true ? `"${queryArgs[key].trim()}"` : queryArgs[key];
    str = replaceAll(str, key, newStr);
  }
  return str;
};

const extractArgs = (querys: string[]) => {
  // To do:: In some cases, the single quotes below may need to be escape.
  const args = { "{query}": querys.join(" "), $1: "" };

  // tslint:disable-next-line: forin
  for (const qIdx in querys) {
    querys[qIdx] = escapeBraket(querys[qIdx]);

    // * Assign args separated by whitespace to each index.
    args[`$${Number(qIdx) + 1}`] = querys[qIdx];
  }

  // Print 'args' to debugging console
  console.log('Args:', args);

  return args;
};

const extractArgsFromScriptFilterItem = (item: ScriptFilterItem, vars: any) => {
  let args = {};
  if (item.arg) {
    item.arg = escapeBraket(item.arg);
    args = { "{query}": item.arg, $1: item.arg };
  }

  // tslint:disable-next-line: forin
  for (const variable in vars) {
    args[`{var:${variable}}`] = `${vars[variable]}`;
  }

  // Print 'args' to debugging console
  console.log('Args:', args);

  return args;
};

export {
  extractArgs,
  extractArgsFromScriptFilterItem,
  handleScriptArgs
};
