const clipboardy = require('clipboardy');

/**
 * @param str
 */
export const copyToClipboard = (str: string): Promise<string> => {
  return clipboardy.write(str);
};
