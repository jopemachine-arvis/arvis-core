import open from 'open';

/**
 * @param  {string} filePath
 */
const openFile = async (filePath: string): Promise<void> => {
  await open(filePath, { wait: false });
};

export { openFile };
