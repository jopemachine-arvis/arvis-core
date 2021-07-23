import { replaceAll } from '../utils';

/**
 * Extract the desired string from queryArgs, and assign it to 'query'.
 * @param queryArgs
 * @param argToExtract
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
