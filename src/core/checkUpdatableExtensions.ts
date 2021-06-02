import fse from 'fs-extra';
import path from 'path';
import readdirp from 'readdirp';
import semver from 'semver';
import { pluginInstallPath, workflowInstallPath } from '../config/path';

/**
 * @summary
 */
export const checkUpdatableExtensions = async (
  type: 'workflow' | 'plugin'
): Promise<any[]> => {
  const updatable: any[] = [];
  const targetDir =
    type === 'workflow' ? workflowInstallPath : pluginInstallPath;

  return new Promise<any[]>((resolve, reject) => {
    readdirp(targetDir, {
      fileFilter: `arvis-${type}.json`,
      depth: 1,
      type: 'files',
    })
      .on('data', (entry) => {
        fse.readJSON(path.resolve(targetDir, entry.path)).then((jsonData) => {
          if (jsonData.latest && jsonData.version) {
            if (semver.gt(jsonData.latest, jsonData.version)) {
              updatable.push({
                current: jsonData.version,
                latest: jsonData.latest,
                name: jsonData.name || jsonData.bundleId,
              });
            }
          }
        });
      })
      .on('error', reject)
      .on('end', () => resolve(updatable));
  });
};
