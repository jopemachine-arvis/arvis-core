const clipboardy = require('clipboardy');

/**
 * @param  {string} str
 */
export const copyToClipboard = (str: string): Promise<string> => {
  return clipboardy.write(str);
};
