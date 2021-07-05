import execa from 'execa';

/**
 * @description
 */
export const getSystemPaths = async (): Promise<string> => {
  // This function is only meaningful in macos
  if (process.platform !== 'darwin') return '';

  return new Promise<any>((resolve, reject) => {
    execa('/usr/libexec/path_helper', [], { cwd: '/usr/libexec' })
      .then((result) => {
        const resultStr = result.stdout;
        const pathStr = /".*"/.exec(resultStr)!.toString();
        const paths = pathStr.substring(1, pathStr.length - 1);
        resolve(paths);
      })
      .catch(reject);
  });
};
