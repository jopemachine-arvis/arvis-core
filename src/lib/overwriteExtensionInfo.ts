import fse from 'fs-extra';
import { getPluginList, getWorkflowList, path } from '../core';

export const overwriteExtensionInfo = async (
  type: 'workflow' | 'plugin',
  bundleId: string,
  infoKey: string,
  info: any
) => {
  const extensions = type === 'workflow' ? getWorkflowList() : getPluginList();
  const extensionJsonPath = type === 'workflow' ? path.getWorkflowConfigJsonPath(bundleId) : path.getPluginConfigJsonPath(bundleId);
  const extension = { ...extensions[bundleId] };

  extension[infoKey] = info;
  extension.bundleId = undefined;

  await fse.writeJSON(extensionJsonPath , extension, { encoding: 'utf-8' });
};