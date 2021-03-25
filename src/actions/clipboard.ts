import clipboardy from "clipboardy";

const copyToClipboard = (str: string) => {
  clipboardy.writeSync(str);
};

export { copyToClipboard };
