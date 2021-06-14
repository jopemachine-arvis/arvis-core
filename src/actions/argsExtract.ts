import { log, LogType } from '../config';
import { replaceAll } from '../utils';

/**
 * @param  {object} queryArgs
 * @param  {string} argToExtract
 * @summary Extract the desired string from queryArgs, and assign it to 'query'.
 */
const argsExtract = (queryArgs: object, argToExtract: string): object => {
  const result: object = { ...queryArgs };

  let targetString = argToExtract;
  for (const arg of Object.keys(queryArgs)) {
    if (argToExtract.includes(arg)) {
      targetString = replaceAll(targetString, arg, queryArgs[arg]);
    }
  }

  if (targetString === argToExtract) {
    log(LogType.info, 'Arg selection could be wrong. {query} not changed.');
  }

  result[`{query}`] = targetString;

  return result;
};

export { argsExtract };
