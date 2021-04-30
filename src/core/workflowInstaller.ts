import chalk from 'chalk';
import gitDownload from 'download-git-repo';
import * as fse from 'fs-extra';
import path from 'path';
import { createStore } from '../config/config';
import { workflowInstallPath } from '../config/path';
import { StoreType } from '../types/storeType';
import { validateUrl } from '../utils';

const installByJson = async (storeType: StoreType, wfConfFilePath: string) => {
  const store = await createStore(storeType);
  const wfConfig = await fse.readJson(wfConfFilePath);

  wfConfFilePath = path.resolve(path.normalize(wfConfFilePath));

  const arr = wfConfFilePath.split(path.sep);
  const wfConfDirPath = arr.slice(0, arr.length - 1).join(path.sep);

  const destinationPath = `${workflowInstallPath}${path.sep}installed${path.sep}${wfConfig.bundleId}`;

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
};

const installByGit = async (storeType: StoreType, giturl: string) => {
  const store = await createStore(storeType);

  // To do : assumedName을 겹치지 않는 랜덤 이름으로 변경
  // 일단 이 이름으로 가정하고 폴더를 clone한 후 wfConf 파일을 읽고 bundleId를 가져와서 그 이름으로 바꾸자..
  const assumedName = giturl.split(path.sep).pop();
  const savedPath = `${workflowInstallPath}${path.sep}installed${path.sep}${assumedName}`;

  fse.mkdirSync(savedPath, { recursive: true });

  gitDownload(`direct:${giturl}`, savedPath, { clone: true }, (err) => {
    console.error(err);
  });

  try {
    const wfConfig = await fse.readJson(`${savedPath}${path.sep}wfconf.json`);
    store.setWorkflow(wfConfig);
  } catch (fileNotExistErr) {
    console.error("wfConfig file not exists.");
    throw new Error(fileNotExistErr);
  }
};

const install = async (storeType: StoreType, arg: string): Promise<void> => {
  if (arg.includes(".json")) {
    await installByJson(storeType, arg);
  } else if (arg.includes(".plist")) {
    // Need to convert alfred's info.plist to json first
    await installByJson(storeType, "");
  } else if (validateUrl(arg)) {
    await installByGit(storeType, arg);
  } else {
    console.log(`'${arg}' is not valid`);
  }
};

const unInstall = async ({
  storeType,
  bundleId,
  wfConfigFilePath,
}: {
  storeType: StoreType;
  bundleId?: string;
  wfConfigFilePath?: string;
}): Promise<void> => {
  const store = await createStore(storeType);

  if (!bundleId && !wfConfigFilePath) {
    throw new Error('Either bundleId or wfConfigFilePath should be set.');
  }

  try {
    if (wfConfigFilePath) {
      const wfConfig = await fse.readJson(wfConfigFilePath);
      bundleId = wfConfig.bundleId;
    }

    const installedDir = `${workflowInstallPath}${path.sep}installed${path.sep}${bundleId}`;

    if (await fse.pathExists(installedDir)) {
      await fse.remove(installedDir);
    }

    store.deleteWorkflow(bundleId!);

  } catch (e) {
    throw new Error(e);
  }
};

export {
  install,
  installByJson,
  installByGit,
  unInstall
};