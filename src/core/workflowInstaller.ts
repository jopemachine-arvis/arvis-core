import { convert } from 'arvis-plist-converter';
import * as fse from 'fs-extra';
import path from 'path';
import unzipper from 'unzipper';
import { v4 as uuidv4 } from 'uuid';
import { Store } from '../config/config';
import { getWorkflowInstalledPath } from '../config/path';

const installByPath = async (installedPath: string): Promise<void | Error> => {
  const store = Store.getInstance();
  const wfConfFilePath = path.resolve(
    path.normalize(`${installedPath}${path.sep}arvis-workflow.json`)
  );

  return new Promise(async (resolve, reject) => {
    let wfConfig;
    try {
      wfConfig = await fse.readJson(wfConfFilePath);
    } catch (err) {
      reject(err);
      return;
    }

    const arr = wfConfFilePath.split(path.sep);
    const wfConfDirPath = arr.slice(0, arr.length - 1).join(path.sep);

    const destinationPath = getWorkflowInstalledPath(wfConfig.bundleId);

    if (fse.existsSync(destinationPath)) {
      await fse.remove(destinationPath);
    }

    await fse.copy(wfConfDirPath, destinationPath, {
      recursive: true,
      overwrite: true,
      preserveTimestamps: false,
    });

    wfConfig.enabled = wfConfig.enabled ?? true;
    store.setWorkflow(wfConfig);

    resolve();
  });
};

const install = async (installFile: string): Promise<void | Error> => {
  let extractedPath: string;
  let zipFileName: string;
  let installPipe: unzipper.ParseStream | null;

  if (
    installFile.endsWith('.arvisworkflow') ||
    installFile.endsWith('.alfredworkflow')
  ) {
    const id = uuidv4();
    const pathArr = installFile.split(path.sep);
    zipFileName = pathArr.pop() as string;
    const dirPath = pathArr.join(path.sep);

    extractedPath = `${dirPath}${path.sep}${id}`;
    installPipe = fse
      .createReadStream(installFile)
      .pipe(unzipper.Extract({ path: extractedPath }));
  } else {
    throw new Error(`Install error, '${installFile}' is not valid`);
  }

  return new Promise((resolve, reject) => {
    installPipe!.on('finish', () => {
      const innerPath = zipFileName.split('.')[0];
      const installedPath = `${extractedPath}${path.sep}${innerPath}`;

      if (installFile.endsWith('.arvisworkflow')) {
        installByPath(installedPath)
          .then(() => {
            resolve();
          })
          .catch(reject)
          .finally(() => {
            fse.remove(extractedPath);
          });
      } else if (installFile.endsWith('.alfredworkflow')) {
        // Need to convert alfred's info.plist to json first
        convert(
          `${installedPath}${path.sep}info.plist`,
          `${installedPath}${path.sep}arvis-workflow.json`
        ).then(() => {
          installByPath(installedPath)
            .then(() => {
              resolve();
            })
            .catch(reject)
            .finally(() => {
              fse.remove(extractedPath);
            });
        });
      }
    });
  });
};

const unInstall = async ({ bundleId }: { bundleId: string }): Promise<void> => {
  const store = Store.getInstance();

  try {
    const installedDir = getWorkflowInstalledPath(bundleId!);

    if (await fse.pathExists(installedDir)) {
      await fse.remove(installedDir);
    }

    store.deleteWorkflow(bundleId!);
  } catch (e) {
    throw new Error(e);
  }
};

export { install, installByPath, unInstall };
