import path from 'path';
import readdirp from 'readdirp';
import { pluginInstallPath, workflowInstallPath } from '../config/path';

/**
 * @summary
 */
export const fetchAllExtensionJsonPaths = async (
  type: 'workflow' | 'plugin'
): Promise<string[]> => {
  const targetFiles: string[] = [];
  const targetDir =
    type === 'workflow' ? workflowInstallPath : pluginInstallPath;

  return new Promise<string[]>((resolve, reject) => {
    readdirp(targetDir, {
      fileFilter: `arvis-${type}.json`,
      depth: 1,
      type: 'files',
    })
      .on('data', (entry) => {
        targetFiles.push(path.resolve(targetDir, entry.path));
      })
      .on('error', reject)
      .on('end', () => resolve(targetFiles));
  });
};
