import * as fse from 'fs-extra';
import conf from '../config/config';

const install = async (wfConfFilePath: string) => {
  try {
    const wfConfig = await fse.readJson(wfConfFilePath);
    conf.set('unicorn', '🦄');
  } catch (e) {
    throw new Error(e);
  }
};

export {
  install
};