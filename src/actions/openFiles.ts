import encodeUrl from 'encodeurl';
import isUrl from 'is-url';
import open from 'open';

/**
 * @param  {string} filePath
 */
const openFile = async (filePath: string): Promise<void> => {
  // Replace whitespace with encoded whitespace
  filePath = filePath.split(' ').join('%20');
  if (isUrl(filePath)) {
    filePath = encodeUrl(filePath);
  }
  await open(filePath, { wait: false });
};

export { openFile };
