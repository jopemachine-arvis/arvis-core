/**
 * @param  {string} str
 * @param  {string} search
 * @param  {string} replace
 */
const replaceAll = (str: string, search: string, replace: string): string => {
  return str.split(search).join(replace);
};

/**
 * @param  {string} str
 * @returns {string} braket escaped string
 */
const escapeBraket = (str: string): string => {
  if (
    (str.startsWith('\'') && str.endsWith('\'')) ||
    (str.startsWith('"') && str.endsWith('"'))
  ) {
    str = str.substring(1, str.length - 1);
  }

  return str;
};

export { replaceAll, escapeBraket };
