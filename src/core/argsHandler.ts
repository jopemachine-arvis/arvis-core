import _ from 'lodash';
import { escapeBraket, replaceAll } from '../utils';
import { WorkManager } from './workManager';

/**
 * @param  {} scriptStr
 * @param  {} queryArgs
 * @param  {} appendQuotes
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
}) => {
  for (const key of Object.keys(queryArgs)) {
    const newStr =
      appendQuotes === true ? `"${queryArgs[key].trim()}"` : queryArgs[key];
    scriptStr = replaceAll(scriptStr, key, newStr);
  }
  return scriptStr.trim();
};

/**
 * @param  {string} scriptStr
 * @param  {any} args
 * @summary Get args from script in correct order
 */
const getAppliedArgsFromScript = (scriptStr: string, args: any) => {
  const strArr: string[] = scriptStr.split(' ');
  const argsArr: string[] = new Array(strArr.length);
  argsArr.fill('');

  for (const arg of Object.keys(args)) {
    // 따옴표 때문에 아래 같은 케이스에서 안 잡히는 경우가 많다. 따옴표 처리 어떻게 할 것인지 명확히 정할 것.
    // args에 작은 따옴표로 감싸진 경우, 큰 따옴표로 감싸진 경우 다 넣어버릴까?
    if (strArr.includes(`'${arg}'`)) {
      const order = strArr.indexOf(`'${arg}'`);
      argsArr[order] = args[arg];
    }
  }

  return _.reduce(
    argsArr,
    (ret, inputArg, idx) => {
      if (inputArg === '') return '';
      return inputArg;
    },
    ''
  );
};

/**
 * @param  {string[]} querys
 */
const extractArgsFromQuery = (querys: string[]) => {
  // To do:: In some cases, the single quotes below may need to be escape.
  const args = { '{query}': querys.join(' '), $1: '' };

  // tslint:disable-next-line: forin
  for (const qIdx in querys) {
    querys[qIdx] = escapeBraket(querys[qIdx]);

    // * Assign args separated by whitespace to each index.
    args[`$${Number(qIdx) + 1}`] = querys[qIdx];
  }

  const workManager = WorkManager.getInstance();

  if (workManager.printArgs) {
    // Print 'args' to debugging console
    console.log('[Args]', args);
  }

  return args;
};

/**
 * @param  {ScriptFilterItem} item
 * @param  {any} vars
 */
const extractArgsFromScriptFilterItem = (item: ScriptFilterItem, vars: any) => {
  let args = {};
  if (item.arg) {
    item.arg = escapeBraket(item.arg);
    args = { '{query}': item.arg, $1: item.arg };
  }

  // tslint:disable-next-line: forin
  for (const variable in vars) {
    args[`{var:${variable}}`] = `${vars[variable]}`;
  }

  const workManager = WorkManager.getInstance();

  if (workManager.printArgs) {
    // Print 'args' to debugging console
    console.log('[Args]', args);
  }

  return args;
};

export {
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
  applyArgsToScript,
  getAppliedArgsFromScript,
};
