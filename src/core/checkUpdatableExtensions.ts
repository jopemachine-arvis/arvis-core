import fse from 'fs-extra';
import semver from 'semver';
import { fetchExtensionJson } from '../utils';

/**
 * @summary
 */
export const checkUpdatableExtensions = async (
  type: 'workflow' | 'plugin'
): Promise<any[]> => {
  const updatable: any[] = [];
  const readJsonWorks: Promise<any>[] = [];

  const files = await fetchExtensionJson(type);

  files.forEach((file) => {
    readJsonWorks.push(fse.readJSON(file));
  });

  const jsonDatas = await Promise.all(readJsonWorks);

  return new Promise((resolve, reject) => {
    jsonDatas.map((jsonData) => {
      if (jsonData.latest && jsonData.version) {
        if (semver.gt(jsonData.latest, jsonData.version)) {
          updatable.push({
            current: jsonData.version,
            latest: jsonData.latest,
            name: jsonData.name,
          });
        }
      }
    });

    resolve(updatable);
  });
};
