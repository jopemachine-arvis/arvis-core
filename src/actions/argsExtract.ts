import { replaceAll } from '../utils';

/**
 * @param  {Record<string, any>} queryArgs
 * @param  {string} argToExtract
 * @summary Extract the desired string from queryArgs, and assign it to 'query'.
 */
export const argsExtract = (queryArgs: Record<string, any>, argToExtract: string): Record<string, any> => {
  const result: Record<string, any> = { ...queryArgs };

  let targetString = argToExtract;
  for (const arg of Object.keys(queryArgs)) {
    if (argToExtract.includes(arg)) {
      targetString = replaceAll(targetString, arg, queryArgs[arg]);
    }
  }

  // Assume argToExtract is constant string.
  if (targetString === argToExtract) {
    targetString = argToExtract;
  }

  result[`{query}`] = targetString;

  return result;
};
