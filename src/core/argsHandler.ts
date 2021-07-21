// tslint:disable: forin
import _ from 'lodash';
import { escapeBraket, replaceAll } from '../utils';

/**
 * @param  {string} str
 * @param  {Record<string, any>} queryArgs
 * @param  {boolean} appendQuotes
 * @return {string} args applied string
 */
const applyArgs = ({
  str,
  queryArgs,
  appendQuotes,
}: {
  str: string;
  queryArgs: Record<string, any>;
  appendQuotes?: boolean;
}): string => {
  for (const key of Object.keys(queryArgs)) {
    if (typeof queryArgs[key] !== 'string') continue;

    const newStr =
      appendQuotes === true ? `"${queryArgs[key].trim()}"` : queryArgs[key];
    str = replaceAll(str, `"${key}"`, newStr);
    str = replaceAll(str, `'${key}'`, newStr);
    str = replaceAll(str, key, newStr);
  }
  return str.trim();
};

/**
 * @param  {string} script
 * @param  {Record<string, any>} queryArgs
 * @param  {boolean} appendQuotes
 * @return {string} args applied string
 * @description In script, all white space characters in 'args' should be escaped.
 */
const applyArgsToScript = ({
  script,
  queryArgs,
}: {
  script: string;
  queryArgs: Record<string, any>;
}): string => {
  for (const key of Object.keys(queryArgs)) {
    if (typeof queryArgs[key] !== 'string') continue;

    const newStr = queryArgs[key].split(' ').filter((str: string) => str).join('\\ ');
    script = replaceAll(script, `"${key}"`, newStr);
    script = replaceAll(script, `'${key}'`, newStr);
    script = replaceAll(script, key, newStr);
  }
  return script;
};

/**
 * @param  {Record<string, any>} args
 * @param  {Action} action
 */
const applyArgsInAction = (args: Record<string, any>, action: Action): Action => {
  const targetAction = { ...action };

  const actionKeys = Object.keys(targetAction);
  for (const actionKey of actionKeys) {
    if (typeof targetAction[actionKey] === 'string') {
      const appendQuotes = actionKey === 'cond' ? true : false;

      // tslint:disable: prefer-conditional-expression
      if (actionKey === 'script' || actionKey === 'scriptFilter') {
        targetAction[actionKey] = applyArgsToScript({ script: targetAction[actionKey], queryArgs: args });
      } else {
        targetAction[actionKey] = applyArgs({ str: targetAction[actionKey], queryArgs: args, appendQuotes });
      }
    } else if (typeof targetAction[actionKey] === 'object') {
      // Stop iterating under actions (except for cond)
      if (actionKey !== 'actions' || (targetAction.actions && targetAction.actions['then'])) {
        targetAction[actionKey] = applyArgsInAction(args, targetAction[actionKey]);
      }
    }
  }

  return targetAction;
};

/**
 * @param  {Record<string, any> | undefined} args
 * @param  {Command} command
 */
const applyArgsInCommand = (args: Record<string, any> | undefined, command: Command): Command => {
  if (!args) return command;

  const targetCommand = { ...command };

  const actionKeys = Object.keys(targetCommand);

  for (const actionKey of actionKeys) {
    if (typeof targetCommand[actionKey] === 'string') {
      targetCommand[actionKey] = applyArgs({ str: targetCommand[actionKey], queryArgs: args });
    } else if (typeof targetCommand[actionKey] === 'object') {
      // Stop iterating under actions
      if (actionKey !== 'actions') {
        targetCommand[actionKey] = applyArgsInCommand(args, targetCommand[actionKey]);
      }
    }
  }

  return targetCommand;
};

/**
 * @param  {Record<string, any>} args
 * @param  {Record<string, any> | undefined} vars
 * @returns  {Record<string, any>}
 */
const applyExtensionVars = (args: Record<string, any>, vars: Record<string, any> | undefined): Record<string, any> => {
  if (vars) {
    for (const variable in vars) {
      args[`{var:${variable}}`] = vars[variable];
    }
  }
  return args;
};

/**
 * @param  {string[]} querys
 * @return {Record<string, any>}
 */
const extractArgsFromQuery = (querys: string[]): Record<string, any> => {
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
 * @return {Record<string, any>}
 */
const extractArgsFromPluginItem = (item: PluginItem): Record<string, any> => {
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
 * @return {Record<string, any>}
 */
const extractArgsFromScriptFilterItem = (
  item: ScriptFilterItem,
  vars: Record<string, any>
): Record<string, any> => {
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
  applyArgsToScript,
  applyArgsInAction,
  applyArgsInCommand,
  applyExtensionVars,
  extractArgsFromPluginItem,
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
};
