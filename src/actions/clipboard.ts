const clipboardy = require('clipboardy');

/**
 * @param  {string} str
 */
const copyToClipboard = (str: string): Promise<string> => {
  return clipboardy.write(str);
};

export { copyToClipboard };
