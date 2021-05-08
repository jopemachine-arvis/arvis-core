import { convert } from 'arvis-plist-converter';
import * as fse from 'fs-extra';
import path from 'path';
import unzipper from 'unzipper';
import { v4 as uuidv4 } from 'uuid';
import { createStore } from '../config/config';
import { getWorkflowInstalledPath } from '../config/path';
import { StoreType } from '../types/storeType';

const installByPath = async (
  storeType: StoreType,
  installedPath: string
): Promise<boolean> => {
  const store = await createStore(storeType);
  const wfConfFilePath = path.resolve(
    path.normalize(`${installedPath}${path.sep}arvis-workflow.json`)
  );

  return new Promise(async (resolve, reject) => {
    const wfConfig = await fse.readJson(wfConfFilePath).catch(reject);

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

    resolve(true);
  });
};

const install = async (
  storeType: StoreType,
  installFile: string
): Promise<boolean> => {
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
        installByPath(storeType, installedPath)
          .then(() => {
            fse.remove(extractedPath);
            resolve(true);
          })
          .catch(reject);
      } else if (installFile.endsWith('.alfredworkflow')) {
        // Need to convert alfred's info.plist to json first
        convert(
          `${installedPath}${path.sep}info.plist`,
          `${installedPath}${path.sep}arvis-workflow.json`
        ).then(() => {
          installByPath(storeType, installedPath)
            .then(() => {
              fse.remove(extractedPath);
              resolve(true);
            })
            .catch(reject);
        });
      }
    });
  });
};

const unInstall = async ({
  storeType,
  bundleId,
}: {
  storeType: StoreType;
  bundleId: string;
}): Promise<void> => {
  const store = await createStore(storeType);

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
