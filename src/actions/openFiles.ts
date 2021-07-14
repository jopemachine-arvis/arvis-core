import encodeUrl from 'encodeurl';
import isUrl from 'is-url';
import open from 'open';

/**
 * @param  {string} filePath
 */
export const openFile = async (filePath: string): Promise<void> => {
  // Replace whitespace with encoded whitespace if there is.
  // If not want this encoding method, replace it in extension before passing it in this.
  const assumeUrl = filePath.split(' ')[0];

  if (isUrl(assumeUrl)) {
    filePath = encodeUrl(filePath);
  }

  await open(filePath, { wait: false });
};
