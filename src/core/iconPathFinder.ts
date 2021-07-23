import isUrl from 'is-url';
import path from 'path';
import {
  getPluginInstalledPath,
  getWorkflowInstalledPath,
} from '../config/path';
import { resolveExtensionType } from '../lib/resolveExtensionType';
import { getPluginList } from './pluginList';
import { getWorkflowList } from './workflowList';

/**
 * @param command
 * @param options?
 */
export const determineIconPath = (
  command: any,
  options?: { supportedImgFormats?: string[] }
): string | undefined => {
  if (!command.bundleId) {
    return undefined;
  }

  const extensionRootPath: string = command.isPluginItem
    ? getPluginInstalledPath(command.bundleId)
    : getWorkflowInstalledPath(command.bundleId);

  let iconPath: string | undefined;
  try {
    if (command.icon) {
      // In case of 'icon' is string
      if (command.icon.length) {
        command.icon = {
          path: command.icon,
        };
      }

      if (isUrl(command.icon.path)) {
        return command.icon.path;
      }

      if (command.icon.path.includes('.')) {
        const iconExt = command.icon.path.split('.').pop();
        if (
          !options ||
          !options.supportedImgFormats ||
          options.supportedImgFormats.includes(iconExt)
        ) {
          iconPath = path.isAbsolute(command.icon.path)
            ? command.icon.path
            : path.resolve(extensionRootPath, command.icon.path);
        }
      }
    }
  } catch (err) {
    // Assume command.icon.path is undefined
  }

  return iconPath;
};

/**
 * @param command
 */
export const determineDefaultIconPath = (command: Command): string | undefined => {
  if (!command.bundleId) {
    return undefined;
  }

  try {
    if (resolveExtensionType(command) === 'plugin') {
      return getPluginList()[command.bundleId].defaultIcon
        ? path.resolve(
            getPluginInstalledPath(command.bundleId),
            getPluginList()[command.bundleId].defaultIcon!
          )
        : undefined;
    }
    return getWorkflowList()[command.bundleId].defaultIcon
      ? path.resolve(
          getWorkflowInstalledPath(command.bundleId),
          getWorkflowList()[command.bundleId].defaultIcon!
        )
      : undefined;
  } catch (err) {
    return undefined;
  }
};
