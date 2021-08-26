import shellEnv from 'shell-env';

/**
 */
export const getShellPaths = async (): Promise<string> => {
  if (process.platform === 'win32') return '';
  const { PATH } = await shellEnv();
  return PATH;
};
