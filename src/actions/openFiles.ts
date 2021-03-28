import open from 'open';

const openFile = async (filePath: string) => {
  await open(filePath, { wait: false });
};

export {
  openFile
};