import encodeUrl from 'encodeurl';
import isUrl from 'is-url';
import open from 'open';

/**
 * @param path
 */
export const openFile = async (path: string): Promise<void> => {
  // Replace whitespace with encoded whitespace if there is.
  // If not want this encoding method, replace it in extension before passing it in this.
  const assumeUrl = path.split(' ')[0];

  if (isUrl(assumeUrl)) {
    path = encodeUrl(path);
  }

  await open(path, { wait: false });
};
