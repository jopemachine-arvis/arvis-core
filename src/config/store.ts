import { validate as validateJson } from 'arvis-extension-validator';
import fse from 'fs-extra';
import _ from 'lodash';
import { findTriggers, getBundleId, pluginWorkspace } from '../core';
import { fetchAllExtensionJsonPaths } from '../lib/fetchAllExtensionJsonPaths';
import { zipDirectory } from '../utils';
import { log, LogType } from './index';
import {
  getPluginConfigJsonPath,
  getPluginInstalledPath,
  getWorkflowConfigJsonPath,
  getWorkflowInstalledPath,
} from './path';

/**
 * @param  {Record<string, Command[]>} commands
 * @param  {string} bundleId
 * @return {Record<string, Command[]>} Commands except for the command equivalent of bundleId.
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
 * @param  {Record<string, Command[]>} commands
 * @param  {Command[]} newCommands
 * @param  {string} bundleId
 * @returns {Record<string, Command[]>} Command object with new commands
 */
const addCommands = (
  commands: Record<string, Command[]>,
  newCommands: Command[],
  bundleId: string
): Record<string, Command[]> => {
  const ret = commands;
  for (const commandObj of newCommands) {
    if (!commandObj.command) continue;

    commandObj.bundleId = bundleId;
    const existing = commands[commandObj.command];

    ret[commandObj.command] = existing
      ? [...existing, commandObj]
      : [commandObj];
  }
  return ret;
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
   * @param  {string} key
   * @param  {any} defaultValue
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
   * @param  {string} bundleId
   * @param  {string} outputPath
   * @description Create zip file exporting plugin with bundleId to outputPath
   */
  public async exportPlugin(bundleId: string, outputPath: string): Promise<void> {
    return zipDirectory(getPluginInstalledPath(bundleId), outputPath);
  }

  /**
   * @param  {string} bundleId
   * @param  {string} outputPath
   * @description Create zip file exporting workflow with bundleId to outputPath
   */
  public async exportWorkflow(bundleId: string, outputPath: string): Promise<void> {
    return zipDirectory(getWorkflowInstalledPath(bundleId), outputPath);
  }

  /**
   * @param  {string} bundleId?
   * @summary Reload workflows info based on workflowInstallPath's arvis-workflow.json
   *          This funtion is called by file watcher if arvis-workflow.json's changes are detected.
   * @description If bundleId is given, reload only that workflow info.
   */
  public async reloadWorkflows(bundleId?: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.setStoreAvailability(false);

      try {
        const extensionInfoFiles: string[] = bundleId ?
          [getWorkflowConfigJsonPath(bundleId)] :
          (await fetchAllExtensionJsonPaths('workflow')).filter((filePath) => {
            return filePath.endsWith('arvis-workflow.json');
          });

        const readJsonPromises: Promise<any>[] = [];

        for (const workflow of extensionInfoFiles) {
          try {
            readJsonPromises.push(fse.readJson(workflow));
          } catch (err) {
            this.setStoreAvailability(true);
            throw new Error('Arvis workflow file format error' + err);
          }
        }

        const readJsonsResult: PromiseSettledResult<any>[] = await Promise.allSettled(readJsonPromises);

        let invalidCnt: number = 0;
        const workflowInfoArr: WorkflowConfigFile[] = readJsonsResult
          .filter((jsonResult) => jsonResult.status === 'fulfilled')
          .map((jsonResult) => (jsonResult as PromiseFulfilledResult<any>).value)
          .filter((workflowInfo: WorkflowConfigFile) => {
            const { valid, errorMsg } = validateJson(workflowInfo, 'workflow');
            if (errorMsg) {
              const err = `'${workflowInfo.name}' has invalid json format.\nSkip loading '${workflowInfo.name}'..\n\n${errorMsg}`;
              log(LogType.error, err);
              invalidCnt += 1;
            }
            return valid;
          });

        if (!bundleId) {
          this.clearWorkflowsInfo();
        }

        this.store.set('hotkeys', {});
        for (const workflowInfo of workflowInfoArr) {
          const extensionBundleId = getBundleId(
            workflowInfo.creator,
            workflowInfo.name
          );

          this.setWorkflow({ bundleId: extensionBundleId, ...workflowInfo });
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
   * @param  {boolean} initializePluginWorkspace
   * @param  {string} bundleId?
   * @summary Reload plugins info based on pluginInstallPath's arvis-plugin.json
   *          This funtion is called by file watcher if arvis-plugin.json's changes are detected.
   * @description If bundleId is given, reload only that plugin info.
   */
  public reloadPlugins = async ({
    initializePluginWorkspace,
    bundleId,
  }: {
    initializePluginWorkspace: boolean;
    bundleId?: string | undefined;
  }): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      this.setStoreAvailability(false);

      try {
        const extensionInfoFiles: string[] = bundleId ?
          [getPluginConfigJsonPath(bundleId)] :
          (await fetchAllExtensionJsonPaths('plugin')).filter((filePath) => {
            return filePath.endsWith('arvis-plugin.json');
          });

        const readJsonPromises: Promise<any>[] = [];

        for (const pluginJson of extensionInfoFiles) {
          try {
            readJsonPromises.push(fse.readJson(pluginJson));
          } catch (err) {
            this.setStoreAvailability(true);
            throw new Error('Arvis plugin file format error' + err);
          }
        }

        const readJsonsResult: PromiseSettledResult<any>[] = await Promise.allSettled(readJsonPromises);

        let invalidCnt: number = 0;
        const pluginInfoArr: PluginConfigFile[] = readJsonsResult
          .filter((jsonResult) => jsonResult.status === 'fulfilled')
          .map((jsonResult) => (jsonResult as PromiseFulfilledResult<any>).value)
          .filter((pluginInfo: PluginConfigFile) => {
            const { valid, errorMsg } = validateJson(pluginInfo, 'plugin');
            if (errorMsg) {
              const err = `'${pluginInfo.name}' has invalid json format.\nSkip loading '${pluginInfo.name}'..\n\n${errorMsg}`;
              log(LogType.error, err);
              invalidCnt += 1;
            }
            return valid;
          });

        pluginInfoArr.forEach((pluginInfo) => {
          pluginInfo.bundleId = getBundleId(
            pluginInfo.creator,
            pluginInfo.name
          );
        });

        const newPluginDict: Record<string, any> = bundleId ? this.getPlugins() : {};

        for (const pluginInfo of pluginInfoArr) {
          newPluginDict[getBundleId(pluginInfo.creator, pluginInfo.name)] =
            pluginInfo;
        }

        this.store.set('plugins', newPluginDict);

        if (initializePluginWorkspace) {
          pluginWorkspace.reload(pluginInfoArr, bundleId);
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

  public getHotkeys(): Record<string, any> {
    return this.getter('hotkeys', {});
  }

  public getPlugins(): Record<string, PluginConfigFile> {
    return this.getter('plugins', {});
  }

  public getTriggers(): (Action | Command) [] {
    return this.getter('triggers', []);
  }

  /**
   * @param  {string} bundleId
   */
  public getWorkflow(bundleId: string) {
    return this.getInstalledWorkflows()[bundleId];
  }

  /**
   * @param  {PluginConfigFile} plugin
   */
  public setPlugin(plugin: PluginConfigFile): void {
    const bundleId = getBundleId(plugin.creator, plugin.name);
    this.store.set('plugins', {
      ...this.getPlugins(),
      [bundleId]: { bundleId, ...plugin },
    });
  }

  /**
   *
   * @param  {WorkflowConfigFile} workflow
   */
  public setWorkflow(workflow: WorkflowConfigFile): void {
    const bundleId = getBundleId(workflow.creator, workflow.name);

    // Update workflow installation info
    const installedWorkflows = this.getInstalledWorkflows();
    installedWorkflows[bundleId] = {
      bundleId,
      ...workflow,
    };

    this.store.set('workflows', installedWorkflows);

    // Update available commands
    let commands: Record<string, Command[]> = this.getCommands();
    commands = removeOldCommand(commands, bundleId);
    commands = addCommands(
      commands,
      findTriggers(['command'], workflow.commands) as Command[],
      bundleId
    );

    // To do:: Add logic here

    this.store.set('commands', commands);

    // Update available hotkeys
    let hotkeys = _.pickBy(
      workflow.commands,
      (command) => command.type === 'hotkey'
    );

    hotkeys = _.map(hotkeys, (command) => {
      return {
        bundleId,
        ...command,
      };
    });

    hotkeys = _.keyBy(hotkeys, (item) => item.hotkey!);
    this.store.set('hotkeys', { ...hotkeys, ...this.getHotkeys() });

    // Update available triggers
    const triggers = this.getTriggers();
    triggers[bundleId] = findTriggers(['command', 'hotkey'], workflow.commands, 'commands');
    this.store.set('triggers', triggers);
  }

  /**
   * @param  {string} bundleId
   * @summary Called to unInstaller to remove information from the workflow from the Store
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
