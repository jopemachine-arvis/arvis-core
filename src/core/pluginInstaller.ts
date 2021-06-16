import { validate as validateJson } from 'arvis-extension-validator';
import chmodr from 'chmodr';
import * as fse from 'fs-extra';
import path from 'path';
import pathExists from 'path-exists';
import rimraf from 'rimraf';
import unzipper from 'unzipper';
import { v4 as uuidv4 } from 'uuid';
import { log, LogType } from '../config';
import { getPluginInstalledPath, tempPath } from '../config/path';
import { Store } from '../config/store';

import { sleep } from '../utils';
import { getBundleId } from './getBundleId';

/**
 * @param  {string} installedPath
 * @return {Promise<void | Error>}
 */
const installByPath = async (installedPath: string): Promise<void | Error> => {
  const store = Store.getInstance();
  const pluginConfFilePath = path.resolve(installedPath, 'arvis-plugin.json');

  return new Promise(async (resolve, reject) => {
    let pluginConfig: PluginConfigFile;
    try {
      pluginConfig = await fse.readJson(pluginConfFilePath);
    } catch (err) {
      reject(err);
      return;
    }

    const { errorMsg, valid } = validateJson(pluginConfig, 'plugin');

    if (!valid) {
      reject(
        new Error(`'arvis-plugin.json' format is invalid\n\n${errorMsg}`)
      );
      return;
    }

    if (
      pluginConfig.platform &&
      !pluginConfig.platform.includes(process.platform)
    ) {
      reject(new Error(`This plugin does not supports '${process.platform}'`));
      return;
    }

    const arr = pluginConfFilePath.split(path.sep);
    const pluginConfDirPath = arr.slice(0, arr.length - 1).join(path.sep);

    const destinationPath = getPluginInstalledPath(
      getBundleId(pluginConfig.creator, pluginConfig.name)
    );

    if (await pathExists(destinationPath)) {
      await fse.remove(destinationPath);
    }

    await fse.copy(pluginConfDirPath, destinationPath, {
      recursive: true,
      overwrite: true,
      preserveTimestamps: false,
    });

    // Makes scripts, binaries of installed paths executable
    chmodr(destinationPath, 0o777, () => {
      pluginConfig.enabled = pluginConfig.enabled ?? true;
      store.setPlugin(pluginConfig);
      resolve();
    });
  });
};

/**
 * @param  {string} installFile arvisplugin files
 * @return {Promise<void | Error>}
 */
const install = async (installFile: string): Promise<void | Error> => {
  let extractedPath: string;
  let unzipStream: unzipper.ParseStream | null;
  const zipFileName: string = installFile.split(path.sep).pop()!;

  if (installFile.endsWith('.arvisplugin')) {
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
      const arvisPluginConfigPath = path.resolve(
        extractedPath,
        'arvis-plugin.json'
      );
      // Supports both compressed with folder and compressed without folders
      const containedWorkflowConf = await pathExists(
        arvisPluginConfigPath
      );
      const folderNotContained = containedWorkflowConf;

      // Suppose it is in the inner folder if it is not in the outer folder. if not, throw error.
      const installedPath = folderNotContained
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
  const installedDir = getPluginInstalledPath(bundleId);
  log(LogType.debug, `Uninstalling '${bundleId}'...`);

  try {
    rimraf(installedDir, () => {
      store.deleteWorkflow(bundleId);
    });
  } catch (error) {
    if (!(await pathExists(installedDir))) {
      return;
    }
    throw new Error(`Extension delete failed!\n\n${error}`);
  }
};

export { install, installByPath, unInstall };
