import alfredWorkflowPlistConvert from 'arvis-plist-converter';
import chmodr from 'chmodr';
import * as fse from 'fs-extra';
import path from 'path';
import rimraf from 'rimraf';
import unzipper from 'unzipper';
import { v4 as uuidv4 } from 'uuid';
import { getWorkflowInstalledPath } from '../config/path';
import { Store } from '../config/store';
import { checkFileExists, sleep } from '../utils';

/**
 * @param  {string} installedPath
 * @return {Promise<void | Error>}
 */
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

    if (!wfConfig.bundleId || wfConfig.bundleId === '') {
      reject(new Error('Invalid workflow - bundleId is not set!'));
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

    // Makes scripts, binaries of installed paths executable
    chmodr(destinationPath, 0o777, () => {
      wfConfig.enabled = wfConfig.enabled ?? true;
      store.setWorkflow(wfConfig);
      resolve();
    });
  });
};

/**
 * @param  {string} installFile arvisworkflow files or alfredworkflow files
 * @return {Promise<void | Error>}
 */
const install = async (installFile: string): Promise<void | Error> => {
  let extractedPath: string;
  let zipFileName: string;
  let installPipe: unzipper.ParseStream | null;

  if (
    installFile.endsWith('.arvisworkflow') ||
    installFile.endsWith('.alfredworkflow')
  ) {
    // Create temporary folder and delete it after installtion
    const temporaryFolderName = uuidv4();
    const pathArr = installFile.split(path.sep);
    zipFileName = pathArr.pop() as string;
    const dirPath = pathArr.join(path.sep);

    extractedPath = `${dirPath}${path.sep}${temporaryFolderName}`;
    installPipe = fse
      .createReadStream(installFile)
      .pipe(unzipper.Extract({ path: extractedPath }));
  } else {
    throw new Error(`Install error, '${installFile}' is not valid`);
  }

  return new Promise(async (resolve, reject) => {
    installPipe!.on('finish', async () => {
      // Even if the install pipe is finalized, there might be a short time when the file is not created yet.
      // It's not clear, so change below logic if it matters later.
      await sleep(1000);

      const innerPath = zipFileName.split('.')[0];
      const plistPath = `${extractedPath}${path.sep}info.plist`;
      const arvisWfConfigPath = `${extractedPath}${path.sep}arvis-workflow.json`;
      // Supports both compressed with folder and compressed without folders
      const containedInfoPlist = await checkFileExists(plistPath);
      const containedWorkflowConf = await checkFileExists(arvisWfConfigPath);
      const folderNotContained = containedInfoPlist || containedWorkflowConf;

      // Suppose it is in the inner folder if it is not in the outer folder. if not, throw error.
      const installedPath = folderNotContained
        ? extractedPath
        : `${extractedPath}${path.sep}${innerPath}`;

      // Need to convert alfred's info.plist to json first
      if (installFile.endsWith('.alfredworkflow')) {
        try {
          await alfredWorkflowPlistConvert(
            `${installedPath}${path.sep}info.plist`,
            `${installedPath}${path.sep}arvis-workflow.json`
          );
        } catch (err) {
          fse.remove(extractedPath);
          reject(err);
        }
      }

      installByPath(installedPath)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          fse.remove(extractedPath);
        });
    });
  });
};

/**
 * @param  {{bundleId:string}} bundleId
 * @return {Promise<void>}
 */
const unInstall = async ({ bundleId }: { bundleId: string }): Promise<void> => {
  const store = Store.getInstance();

  try {
    const installedDir = getWorkflowInstalledPath(bundleId);

    rimraf(installedDir, () => {
      store.deleteWorkflow(bundleId);
    });

  } catch (e) {
    throw new Error(e);
  }
};

export { install, installByPath, unInstall };
