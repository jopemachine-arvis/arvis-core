import encodeUrl from 'encodeurl';
import isUrl from 'is-url';
import open from 'open';

/**
 * @param  {string} filePath
 */
const openFile = async (filePath: string): Promise<void> => {
  if (isUrl(filePath)) {
    filePath = encodeUrl(filePath);
  }
  await open(filePath, { wait: false });
};

export { openFile };
