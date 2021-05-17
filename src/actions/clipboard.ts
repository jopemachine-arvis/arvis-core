const clipboardy = require('clipboardy');

/**
 * @param  {string} str
 */
const copyToClipboard = (str: string): void => {
  clipboardy.write(str);
};

export { copyToClipboard };
