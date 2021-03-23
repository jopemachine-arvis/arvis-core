import * as fse from 'fs-extra';
import { deleteWorkflow, setWorkflow, getWorkflow } from '../config/config';

const install = async (wfConfFilePath: string) => {
  try {
    const wfConfig = await fse.readJson(wfConfFilePath);
    wfConfig.enabled = wfConfig.enabled ?? true;
    setWorkflow(wfConfig);
  } catch (e) {
    throw new Error(e);
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
  } catch (e) {
    throw new Error(e);
  }
};

export {
  install,
  unInstall
};