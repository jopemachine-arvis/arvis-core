const clipboardy = require('clipboardy');

const copyToClipboard = (str: string) => {
  clipboardy.write(str);
};

export { copyToClipboard };
