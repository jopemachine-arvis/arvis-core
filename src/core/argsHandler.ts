// tslint:disable: forin
import _ from 'lodash';
import { getClipboardText } from '../lib/getClipboardText';
import { escapeBraket, replaceAll } from '../utils';

/**
 * @param str
 * @param queryArgs
 * @param appendQuotes
 * @returns applied string
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
 * In script, all white space characters in 'args' should be escaped.
 * @param script
 * @param queryArgs
 * @returns applied string
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
 * @param args
 * @param action
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
 * @param args
 * @param command
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
 * @param args
 * @param vars
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
 */
const extractArgsFromHotkey = async () => {
  return {
    '{query}': '',
    '{clipboard}': await getClipboardText(),
    $1: '',
  };
};

/**
 * @param querys
 */
const extractArgsFromQuery = async (querys: string[]): Promise<Record<string, any>> => {
  const args = {
    '{query}': querys.join(' '),
    '{clipboard}': await getClipboardText(),
    $1: '',
  };

  for (const qIdx in querys) {
    querys[qIdx] = escapeBraket(querys[qIdx]);

    // * Assign args separated by whitespace to each index.
    args[`$${Number(qIdx) + 1}`] = querys[qIdx];
  }

  return args;
};

/**
 * @param item
 */
const extractArgsFromPluginItem = async (item: PluginItem): Promise<Record<string, any>> => {
  let args = {};

  if (item.arg) {
    if (typeof item.arg === 'string') {
      const arg = escapeBraket(item.arg);
      args = {
        '{query}': arg,
        '{clipboard}': await getClipboardText(),
        $1: arg,
      };
    } else if (typeof item.arg === 'number') {
      args = {
        '{query}': item.arg,
        '{clipboard}': await getClipboardText(),
        $1: item.arg,
      };
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
 * @param item
 * @param vars
 */
const extractArgsFromScriptFilterItem = async (
  item: ScriptFilterItem,
  vars: Record<string, any>
): Promise<Record<string, any>> => {
  let args = {};

  if (item.arg) {
    if (typeof item.arg === 'string') {
      const arg = escapeBraket(item.arg);
      args = {
        '{query}': arg,
        '{clipboard}': await getClipboardText(),
        $1: arg,
      };
    } else if (typeof item.arg === 'number') {
      args = {
        '{query}': item.arg,
        '{clipboard}': await getClipboardText(),
        $1: item.arg,
      };
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
  applyArgsInAction,
  applyArgsInCommand,
  applyArgsToScript,
  applyExtensionVars,
  extractArgsFromHotkey,
  extractArgsFromPluginItem,
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
};
