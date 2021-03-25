import * as fse from 'fs-extra';
import { deleteWorkflow, setWorkflow } from '../config/config';
import gitDownload from 'download-git-repo';
import path from 'path';
import chalk from 'chalk';
import { validateUrl } from '../utils';

const installByJson = async (wfConfFilePath: string) => {
  try {
    const wfConfig = await fse.readJson(wfConfFilePath);
    wfConfig.enabled = wfConfig.enabled ?? true;
    setWorkflow(wfConfig);

    let normalizedPath = path.resolve(path.normalize(wfConfFilePath));

    // To do : Refactor this
    if (fse.lstatSync(normalizedPath).isFile()) {
      const arr = normalizedPath.split(path.sep);
      normalizedPath = arr.slice(0, arr.length - 1).join(path.sep);
    }

    const savedPath = `.${path.sep}installed${path.sep}${wfConfig.bundleId}`;

    fse.mkdirSync(savedPath, { recursive: true });
    fse.copy(normalizedPath, savedPath, { recursive: true });
  } catch (e) {
    throw new Error(e);
  }
};

const installByGit = async (giturl: string) => {
  // To do : assumedName을 겹치지 않는 랜덤 이름으로 변경
  // 일단 이 이름으로 가정하고 폴더를 clone한 후 wfConf 파일을 읽고 bundleId를 가져와서 그 이름으로 바꾸자..
  const assumedName = giturl.split(path.sep).pop();
  const savedPath = `.${path.sep}installed${path.sep}${assumedName}`;
  fse.mkdirSync(savedPath, { recursive: true });

  gitDownload(`direct:${giturl}`, savedPath, { clone: true }, (err) => {
    console.error(err);
  });

  try {
    const wfConfig = await fse.readJson(
      `.${path.sep}installed${path.sep}${assumedName}${path.sep}wfconf.json`
    );
    setWorkflow(wfConfig);
  } catch (fileNotExistErr) {
    console.error("wfConfig file not exists.");
    throw new Error(fileNotExistErr);
  }
};

const install = (arg: string) => {
  if (arg.includes('.json')) {
    installByJson(arg);
  } else if (validateUrl(arg)) {
    installByGit(arg);
  } else {
    console.log(`'${arg}' is not valid`);
  }
};

const unInstall = async (bundleIdOrWfConfPath: string) => {
  try {
    let bundleId = bundleIdOrWfConfPath;
    if (bundleIdOrWfConfPath.includes('.json')) {
      const wfConfig = await fse.readJson(bundleIdOrWfConfPath);
      bundleId = wfConfig.bundleId;
    }

    deleteWorkflow(bundleId);

    const installedDir = `.${path.sep}installed${path.sep}${bundleId}`;
    if (await fse.pathExists(installedDir)) {
      fse.remove(installedDir);
    } else {
      throw new Error(chalk.red(`${installedDir} not exist,`));
    }
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