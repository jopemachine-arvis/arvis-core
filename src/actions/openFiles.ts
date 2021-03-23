import open from 'open';

const openFile = async (filePath: string) => {
  await open(filePath, { wait: true });
};

export {
  openFile
};