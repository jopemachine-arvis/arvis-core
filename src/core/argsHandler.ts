// tslint:disable: forin
import _ from 'lodash';
import { escapeBraket, replaceAll } from '../utils';

/**
 * @param  {string} scriptStr
 * @param  {object} queryArgs
 * @param  {boolean} appendQuotes
 * @return {string} argsAppliedScriptStr
 */
const applyArgsToScript = ({
  scriptStr,
  queryArgs,
  appendQuotes,
}: {
  scriptStr: string;
  queryArgs: object;
  appendQuotes?: boolean;
}): string => {
  for (const key of Object.keys(queryArgs)) {
    const newStr =
      appendQuotes === true ? `"${queryArgs[key].trim()}"` : queryArgs[key];
    scriptStr = replaceAll(scriptStr, key, newStr);
  }
  return scriptStr.trim();
};

/**
 * @param  {string} scriptStr
 * @param  {object} args
 * @return {string}
 * @summary Get args from script in correct order
 */
const getAppliedArgsFromScript = (scriptStr: string, args: object): string => {
  const strArr: string[] = scriptStr.split(' ');
  const argsArr: string[] = new Array(strArr.length);
  argsArr.fill('');

  for (const arg of Object.keys(args)) {
    if (strArr.includes(`'${arg}'`)) {
      const order = strArr.indexOf(`'${arg}'`);
      argsArr[order] = args[arg];
    }
  }

  return _.reduce(
    argsArr,
    (ret, inputArg, idx) => {
      if (inputArg === '') return '';
      return ret + ' ' + inputArg;
    },
    ''
  );
};

/**
 * @param  {string[]} querys
 * @return {object}
 */
const extractArgsFromQuery = (querys: string[]): object => {
  const args = { '{query}': querys.join(' '), $1: '' };

  for (const qIdx in querys) {
    querys[qIdx] = escapeBraket(querys[qIdx]);

    // * Assign args separated by whitespace to each index.
    args[`$${Number(qIdx) + 1}`] = querys[qIdx];
  }

  return args;
};

/**
 * @param  {PluginItem} item
 * @return {object}
 */
const extractArgsFromPluginItem = (item: PluginItem): object => {
  let args = {};

  if (item.arg) {
    if (typeof item.arg === 'string') {
      const arg = escapeBraket(item.arg);
      args = { '{query}': arg, $1: arg };
    } else {
      args = { ...item.arg };
    }
  }

  return args;
};

/**
 * @param  {ScriptFilterItem} item
 * @param  {any} vars
 * @return {object}
 */
const extractArgsFromScriptFilterItem = (
  item: ScriptFilterItem,
  vars: object
): object => {
  let args = {};

  if (item.arg) {
    if (typeof item.arg === 'string') {
      const arg = escapeBraket(item.arg);
      args = { '{query}': arg, $1: arg };
    } else if (typeof item.arg === 'number') {
      args = { '{query}': item.arg, $1: item.arg };
    } else {
      args = { ...item.arg };
    }
  }

  if (item.variables) {
    vars = { ...vars, ...item.variables };
  }

  for (const variable in vars) {
    args[`{var:${variable}}`] = `${vars[variable]}`;
  }

  return args;
};

/**
 * @param  {object} args
 * @param  {object} vars
 * @returns variable
 */
const applyExtensionVars = (args: object, vars: object): object => {
  for (const variable in vars) {
    args[`{var:${variable}}`] = `${vars[variable]}`;
  }
  return args;
};

export {
  applyExtensionVars,
  extractArgsFromQuery,
  extractArgsFromPluginItem,
  extractArgsFromScriptFilterItem,
  applyArgsToScript,
  getAppliedArgsFromScript,
};
