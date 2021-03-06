import semver from 'semver';
import { log, LogType } from '../config';
import { fetchAllExtensionJsonPaths } from '../lib/fetchAllExtensionJsonPaths';
import { readJson5 } from '../utils';

/**
 * @summary
 */
export const checkUpdatableExtensions = async (
  type: 'workflow' | 'plugin'
): Promise<any[]> => {
  const updatable: any[] = [];
  const readJsonWorks: Promise<any>[] = [];

  const files = await fetchAllExtensionJsonPaths(type);

  files.forEach((file) => {
    readJsonWorks.push(readJson5(file));
  });

  try {
    const jsonDatas = await Promise.all(readJsonWorks);

    return new Promise((resolve, _reject) => {
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
  } catch (err) {
    log(
      LogType.error,
      `Error occured in json parsing in 'checkUpdatableExtensions'\n\n${err}`
    );
    return [];
  }
};
