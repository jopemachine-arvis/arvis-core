import { replaceAll } from '../utils';

/**
 * @param  {object} queryArgs
 * @param  {string} argToExtract
 * @summary Extract the desired string from queryArgs, and assign it to query and $1.
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
    console.error('Arg selection is wrong');
  }

  result[`${argToExtract}`] = targetString;
  result[`{query}`] = targetString;
  result[`$1`] = targetString;

  return result;
};

export { argsExtract };
