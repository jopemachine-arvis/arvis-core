const clipboardy = require('clipboardy');

export const getClipboardText = async () => {
  try {
    return await clipboardy.read();
  } catch (err) {
    return '';
  }
};