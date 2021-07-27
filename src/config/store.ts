import fse from 'fs-extra';
import _ from 'lodash';
import { findTriggers, getBundleId, pluginWorkspace } from '../core';
import { applyArgsInCommand } from '../core/argsHandler';
import { fetchAllExtensionJsonPaths } from '../lib/fetchAllExtensionJsonPaths';
import { zipDirectory } from '../utils';
import { log, LogType } from './logger';
import {
  getPluginConfigJsonPath,
  getPluginInstalledPath,
  getWorkflowConfigJsonPath,
  getWorkflowInstalledPath,
} from './path';

/**
 * @param commands
 * @param bundleId
 * @returns Commands except for the command equivalent of bundleId.
 */
const removeOldCommand = (commands: Record<string, Command[]>, bundleId: string): Record<string, Command[]> => {
  const ret = commands;
  for (const commandKey of Object.keys(commands)) {
    const commandArr: Command[] = commands[commandKey];

    // To remove old commands, filter commands with same bundleId
    const otherWorkflowsSameCommands = commandArr.filter(
      (command: any) => command.bundleId !== bundleId
    );

    ret[commandKey] = otherWorkflowsSameCommands;
  }
  return ret;
};

/**
 * @param commands
 * @param newCommands
 * @param bundleId
 * @param vars
 * @returns Command object with new commands
 */
const addCommands = (
  commands: Record<string, Command[]>,
  newCommands: Command[],
  bundleId: string,
  vars: Record<string, any> | undefined,
): Record<string, Command[]> => {
  const ret = commands;
  for (const commandObj of newCommands) {
    if (!commandObj.command) continue;

    commandObj.bundleId = bundleId;
    const existing = commands[commandObj.command];

    const argsResolvedCommandObj = applyArgsInCommand(vars, commandObj);

    ret[argsResolvedCommandObj.command!] = existing
      ? [...existing, argsResolvedCommandObj]
      : [argsResolvedCommandObj];
  }
  return ret;
};

/**
 * @param vars
 * @param commands
 */
const applyExtensionVarToTrigger = (vars: Record<string, any> | undefined, commands: Record<string, Command[]>): Record<string, Command[]> => {
  if (!vars) return commands;

  const newCommands = { ...commands };

  for (const commandStr of Object.keys(newCommands)) {
    newCommands[commandStr] = commands[commandStr].map((commandObj) => applyArgsInCommand(vars, commandObj));
  }

  return newCommands;
};

/**
 * @param info
 */
const injectBundleId = (info: WorkflowConfigFile | PluginConfigFile): WorkflowConfigFile | PluginConfigFile => {
  info.bundleId = getBundleId(info.creator, info.name);
  return info;
};

/**
 * @summary
 */
export class Store {
  private static instance: Store;
  public static onStoreUpdate?: (available: boolean) => void;

  private store: Map<string, any>;
  public checkStoreIsAvailable?: (available: boolean) => void;

  public static getInstance() {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  private constructor() {
    this.store = new Map<string, any>();
  }

  private setStoreAvailability(available: boolean) {
    Store.onStoreUpdate && Store.onStoreUpdate(available);

    if (this.checkStoreIsAvailable) {
      this.checkStoreIsAvailable(available);
    }
  }

  /**
   * @param key
   * @param defaultValue
   */
  private getter(key: string, defaultValue: any) {
    if (this.store.has(key)) {
      return this.store.get(key) as any;
    } else {
      return defaultValue;
    }
  }

  private clearWorkflowsInfo() {
    this.store.set('commands', {});
    this.store.set('workflows', {});
    this.store.set('hotkeys', {});
    this.store.set('triggers', []);
  }

  private clearPluginsInfo() {
    this.store.set('plugins', {});
  }

  public reset() {
    this.clearWorkflowsInfo();
    this.clearPluginsInfo();
  }

  /**
   * Create zip file exporting plugin with bundleId to outputPath
   * @param bundleId
   * @param outputPath
   */
  public async exportPlugin(bundleId: string, outputPath: string): Promise<void> {
    return zipDirectory(getPluginInstalledPath(bundleId), outputPath);
  }

  /**
   * Create zip file exporting workflow with bundleId to outputPath
   * @param bundleId
   * @param outputPath
   */
  public async exportWorkflow(bundleId: string, outputPath: string): Promise<void> {
    return zipDirectory(getWorkflowInstalledPath(bundleId), outputPath);
  }

  /**
   * Reload workflows info based on workflowInstallPath's arvis-workflow.json
   * This funtion is called by file watcher if arvis-workflow.json's changes are detected.
   * If bundleIds is given, reload only that workflows info.
   * @param bundleIds?
   */
  public reloadWorkflows = async (bundleIds?: string[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      this.setStoreAvailability(false);

      try {
        const extensionInfoFiles: string[] = bundleIds ?
          bundleIds.map(getWorkflowConfigJsonPath) :
          (await fetchAllExtensionJsonPaths('workflow')).filter((filePath) => {
            return filePath.endsWith('arvis-workflow.json');
          });

        const readJsonsResult: PromiseSettledResult<any>[] = await Promise.allSettled(extensionInfoFiles.map((file) => fse.readJson(file)));

        let invalidCnt: number = 0;
        const workflowInfoArr: WorkflowConfigFile[] = readJsonsResult
          .filter((jsonResult) => jsonResult.status === 'fulfilled')
          .map((jsonResult) => (jsonResult as PromiseFulfilledResult<any>).value)
          .filter((extensionInfo: WorkflowConfigFile) => {
            if (!extensionInfo.creator || !extensionInfo.name) {
              const err = `'${extensionInfo.name}' has invalid json format.\nSkip loading '${extensionInfo.name}'..`;
              log(LogType.error, err);
              invalidCnt += 1;
              return false;
            }
            return true;
          });

        if (!bundleIds) {
          this.clearWorkflowsInfo();
        }

        this.store.set('hotkeys', {});
        for (const workflowInfo of workflowInfoArr) {
          this.setWorkflow(injectBundleId(workflowInfo) as WorkflowConfigFile);
        }

        this.setStoreAvailability(true);

        const errorCnt: number = readJsonsResult.filter(
          (jsonResult) => jsonResult.status === 'rejected'
        ).length + invalidCnt;

        if (errorCnt !== 0) {
          reject(new Error(`${errorCnt} workflows have format errors in arvis-workflow.json\nOpen devtools to check which workflow has invalid format.`));
        } else {
          resolve();
        }

      } catch (err) {
        reject(err);
        this.setStoreAvailability(true);
      }
    });
  }

  /**
   * Reload plugins info based on pluginInstallPath's arvis-plugin.json
   * This funtion is called by file watcher if arvis-plugin.json's changes are detected.
   * If bundleIds is given, reload only that plugins info.
   * @param initializePluginWorkspace
   * @param bundleIds?
   */
  public reloadPlugins = async ({
    initializePluginWorkspace,
    bundleIds,
  }: {
    initializePluginWorkspace: boolean;
    bundleIds?: string[] | undefined;
  }): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      this.setStoreAvailability(false);

      try {
        const extensionInfoFiles: string[] = bundleIds ?
          bundleIds.map(getPluginConfigJsonPath) :
          (await fetchAllExtensionJsonPaths('plugin')).filter((filePath) => {
            return filePath.endsWith('arvis-plugin.json');
          });

        const readJsonsResult: PromiseSettledResult<any>[] = await Promise.allSettled(extensionInfoFiles.map((file) => fse.readJson(file)));

        let invalidCnt: number = 0;
        const pluginInfoArr: PluginConfigFile[] = readJsonsResult
          .filter((jsonResult) => jsonResult.status === 'fulfilled')
          .map((jsonResult) => (jsonResult as PromiseFulfilledResult<any>).value)
          .filter((extensionInfo: WorkflowConfigFile) => {
            if (!extensionInfo.creator || !extensionInfo.name) {
              const err = `'${extensionInfo.name}' has invalid json format.\nSkip loading '${extensionInfo.name}'..`;
              log(LogType.error, err);
              invalidCnt += 1;
              return false;
            }
            return true;
          })
          .map((pluginInfo) => injectBundleId(pluginInfo) as PluginConfigFile);

        const newPluginDict: Record<string, any> = bundleIds ? this.getPlugins() : {};

        for (const pluginInfo of pluginInfoArr) {
          newPluginDict[getBundleId(pluginInfo.creator, pluginInfo.name)] =
            pluginInfo;
        }

        this.store.set('plugins', newPluginDict);

        if (initializePluginWorkspace) {
          pluginWorkspace.reload(pluginInfoArr, bundleIds);
        }

        this.setStoreAvailability(true);

        const errorCnt: number = readJsonsResult.filter(
          (jsonResult) => jsonResult.status === 'rejected'
        ).length + invalidCnt;

        if (errorCnt !== 0) {
          reject(new Error(`${errorCnt} plugins have format errors in arvis-plugin.json\nOpen devtools to check which plugins has invalid format.`));
        } else {
          resolve();
        }
      } catch (err) {
        reject(err);
        this.setStoreAvailability(true);
      }
    });
  }

  public getInstalledWorkflows(): Record<string, WorkflowConfigFile> {
    return this.getter('workflows', {});
  }

  public getCommands(): Record<string, Command[]> {
    return this.getter('commands', {});
  }

  public getHotkeys(): Record<string, Command> {
    return this.getter('hotkeys', {});
  }

  public getPlugins(): Record<string, PluginConfigFile> {
    return this.getter('plugins', {});
  }

  public getTriggers(): Record<string, (Action | Command)[]> {
    return this.getter('triggers', []);
  }

  /**
   * @param bundleId
   */
  public getWorkflow = (bundleId: string) => {
    return this.getInstalledWorkflows()[bundleId];
  }

  /**
   * @param plugin
   */
  public setPlugin = (plugin: PluginConfigFile): void => {
    this.store.set('plugins', {
      ...this.getPlugins(),
      [getBundleId(plugin.creator, plugin.name)]: injectBundleId(plugin),
    });
  }

  /**
   * @param workflow
   */
  public setWorkflow = (workflow: WorkflowConfigFile): void => {
    const bundleId = getBundleId(workflow.creator, workflow.name);

    // Update workflow installation info
    const installedWorkflows = this.getInstalledWorkflows();
    installedWorkflows[bundleId] = injectBundleId(workflow) as WorkflowConfigFile;

    this.store.set('workflows', installedWorkflows);

    // Update available commands
    const commands: Record<string, Command[]> =
      applyExtensionVarToTrigger(
        workflow.variables,
        addCommands(
          removeOldCommand(this.getCommands(), bundleId),
          findTriggers(['command'], workflow.commands) as Command[],
          bundleId,
          workflow.variables
        )
      );

    this.store.set('commands', commands);

    // Update available hotkeys
    const hotkeys: Record<string, Command> = _.keyBy(_.map(_.pickBy(
      workflow.commands,
      (command) => command.type === 'hotkey'
    ), (command) => {
      return {
        bundleId,
        ...command,
      };
    }), (item) => item.hotkey!);

    Object.keys(hotkeys).forEach((hotkey: string) => {
      const hotkeyCommand = applyArgsInCommand(workflow.variables, hotkeys[hotkey]);
      if (hotkey !== hotkeyCommand.hotkey) {
        delete hotkeys[hotkey];
        hotkeys[hotkeyCommand.hotkey!] = hotkeyCommand;
      }
    });

    this.store.set('hotkeys', { ...hotkeys, ...this.getHotkeys() });

    // Update available triggers
    const triggers = this.getTriggers();
    triggers[bundleId] = findTriggers(['command', 'hotkey'], workflow.commands, 'commands');
    this.store.set('triggers', triggers);
  }

  /**
   * Called to unInstaller to remove information from the workflow from the Store
   * @param bundleId
   */
  public deleteWorkflow(bundleId: string): void {
    // Update workflow installation info
    const installedWorkflows = this.getInstalledWorkflows();
    delete installedWorkflows[bundleId];
    this.store.set('workflows', installedWorkflows);

    // Update available commands
    const allCommands = this.getCommands();
    for (const command of Object.keys(allCommands)) {
      // Command bar corresponding to that command
      // Should be handled as an array because workflows could use the same command
      const commands: Command[] = allCommands[command];

      for (let commandIdx = 0; commandIdx < commands.length; ++commandIdx) {
        // Delete all command which bundle id equals `bundleId`
        if (commands[commandIdx].bundleId === bundleId) {
          commands.splice(commandIdx, 1);
          --commandIdx;
        }
      }

      if (commands.length === 0) {
        delete allCommands[command];
      } else {
        allCommands[command] = commands;
      }
    }
    this.store.set('commands', allCommands);

    // Update available hotkeys
    const availableHotkeys = this.getHotkeys();
    const hotkeys = _.pickBy(
      availableHotkeys,
      (hotkey) => hotkey.bundleId !== bundleId
    );

    this.store.set('hotkeys', hotkeys);

    // Update triggers
    const existingTriggers = this.getTriggers();
    delete existingTriggers[bundleId];
    this.store.set('triggers', existingTriggers);
  }
}
