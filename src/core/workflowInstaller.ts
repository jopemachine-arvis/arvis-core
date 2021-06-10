import { validate as validateJson } from '@jopemachine/arvis-extension-validator';
import chmodr from 'chmodr';
import * as fse from 'fs-extra';
import path from 'path';
import rimraf from 'rimraf';
import unzipper from 'unzipper';
import { v4 as uuidv4 } from 'uuid';
import { log, LogType } from '../config';
import { getWorkflowInstalledPath, tempPath } from '../config/path';
import { Store } from '../config/store';
import { checkFileExists, sleep } from '../utils';
import { getBundleId } from './getBundleId';

/**
 * @param  {string} installedPath
 * @return {Promise<void | Error>}
 */
const installByPath = async (installedPath: string): Promise<void | Error> => {
  const store = Store.getInstance();
  const workflowConfFilePath = path.resolve(
    installedPath,
    'arvis-workflow.json'
  );

  return new Promise(async (resolve, reject) => {
    let workflowConfig: WorkflowConfigFile;
    try {
      workflowConfig = await fse.readJson(workflowConfFilePath);
    } catch (err) {
      reject(err);
      return;
    }

    const { errors, valid } = validateJson(workflowConfig, 'workflow');

    if (!valid) {
      reject(
        new Error(
          `'arvis-workflow.json' format is invalid\n${errors
            .map((error) => error.message)
            .join('\n')}`
        )
      );
      return;
    }

    if (
      workflowConfig.platform &&
      !workflowConfig.platform.includes(process.platform)
    ) {
      reject(new Error(`This workflow not supports '${process.platform}'`));
      return;
    }

    const arr = workflowConfFilePath.split(path.sep);
    const workflowConfDirPath = arr.slice(0, arr.length - 1).join(path.sep);

    const destinationPath = getWorkflowInstalledPath(
      getBundleId(workflowConfig.createdby, workflowConfig.name)
    );

    if (await checkFileExists(destinationPath)) {
      await fse.remove(destinationPath);
    }

    await fse.copy(workflowConfDirPath, destinationPath, {
      recursive: true,
      overwrite: true,
      preserveTimestamps: false,
    });

    // Makes scripts, binaries of installed paths executable
    chmodr(destinationPath, 0o777, () => {
      workflowConfig.enabled = workflowConfig.enabled ?? true;
      store.setWorkflow(workflowConfig);
      resolve();
    });
  });
};

/**
 * @param  {string} installFile arvisworkflow file
 * @return {Promise<void | Error>}
 */
const install = async (installFile: string): Promise<void | Error> => {
  let extractedPath: string;
  let unzipStream: unzipper.ParseStream | null;
  const zipFileName: string = installFile.split(path.sep).pop()!;

  if (installFile.endsWith('.arvisworkflow')) {
    // Create temporary folder and delete it after installtion
    const temporaryFolderName = uuidv4();

    extractedPath = path.resolve(tempPath, temporaryFolderName);
    unzipStream = fse
      .createReadStream(installFile)
      .pipe(unzipper.Extract({ path: extractedPath }));
  } else {
    throw new Error(`Install error, '${installFile}' is not valid`);
  }

  return new Promise(async (resolve, reject) => {
    unzipStream!.on('finish', async () => {
      log(LogType.debug, 'Unzip finished..');
      // even if the install pipe is finalized, there might be a short time when the file is not created yet.
      // it's not clear, so change below logic if it matters later.
      await sleep(1000);

      const innerPath = zipFileName.split('.')[0];
      const arvisWorkflowConfigPath = path.resolve(
        extractedPath,
        'arvis-workflow.json'
      );

      // Supports both compressed with folder and compressed without folders
      const containedWorkflowConf = await checkFileExists(
        arvisWorkflowConfigPath
      );

      // Suppose it is in the inner folder if it is not in the outer folder. if not, throw error.
      const installedPath = containedWorkflowConf
        ? extractedPath
        : `${extractedPath}${path.sep}${innerPath}`;

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
  const installedDir = getWorkflowInstalledPath(bundleId);
  log(LogType.debug, `Uninstalling '${bundleId}'...`);

  try {
    rimraf(installedDir, () => {
      store.deleteWorkflow(bundleId);
    });
  } catch (error) {
    if (!(await checkFileExists(installedDir))) {
      return;
    }
    throw new Error(`Extension delete failed!\n\n${error}`);
  }
};

export { install, installByPath, unInstall };
