const clipboardy = require('clipboardy');

/**
 * @param  {string} str
 */
const copyToClipboard = (str: string) => {
  clipboardy.write(str);
};

export { copyToClipboard };
