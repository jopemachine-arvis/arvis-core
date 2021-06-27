// tslint:disable: forin
import _ from 'lodash';
import { escapeBraket, replaceAll } from '../utils';

/**
 * @param  {string} scriptStr
 * @param  {object} queryArgs
 * @param  {boolean} appendQuotes
 * @return {string} args applied string
 */
const applyArgs = ({
  str,
  queryArgs,
  appendQuotes,
}: {
  str: string;
  queryArgs: object;
  appendQuotes?: boolean;
}): string => {
  for (const key of Object.keys(queryArgs)) {
    const newStr =
      appendQuotes === true ? `"${queryArgs[key].trim()}"` : queryArgs[key];
    str = replaceAll(str, key, newStr);
  }
  return str.trim();
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
    } else if (typeof item.arg === 'number') {
      args = { '{query}': item.arg, $1: item.arg };
    } else {
      args = { ...item.arg };
    }
  }

  for (const variable in item.variables) {
    args[`{var:${variable}}`] = `${item.variables[variable]}`;
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

export {
  applyArgs,
  applyExtensionVars,
  extractArgsFromPluginItem,
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
};
