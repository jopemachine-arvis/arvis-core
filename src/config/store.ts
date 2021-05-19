import fse from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import recursiveReaddir from 'recursive-readdir';
import pluginWorkspace from '../core/pluginWorkspace';
import { zipDirectory } from '../utils/zip';
import {
  getPluginInstalledPath,
  getWorkflowInstalledPath,
  pluginInstallPath,
  workflowInstallPath,
} from './path';

/**
 * @param  {object} commands
 * @param  {string} bundleId
 * @return {object} Commands except for the command equivalent of bundleId.
 */
const removeOldCommand = (commands: object, bundleId: string) => {
  const ret = commands;
  for (const commandKey of Object.keys(commands)) {
    const commandObj = commands[commandKey];

    // To remove old commands, filter commands with same bundleId
    const otherWorkflowsSameCommands = commandObj.filter(
      (command: any) => command.bundleId !== bundleId
    );

    ret[commandKey] = otherWorkflowsSameCommands;
  }
  return ret;
};

/**
 * @param  {object} commands
 * @param  {any[]} newCommands
 * @param  {string} bundleId
 * @returns {object} Command object with new commands
 */
const addCommands = (
  commands: object,
  newCommands: any[],
  bundleId: string
) => {
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

export class Store {
  private static instance: Store;
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
    if (this.checkStoreIsAvailable) {
      if (available === false) console.log('Store is occupied in Arvis now..');
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
  public exportPlugin(bundleId: string, outputPath: string) {
    return zipDirectory(getPluginInstalledPath(bundleId), outputPath);
  }

  /**
   * @param  {string} bundleId
   * @param  {string} outputPath
   * @description Create zip file exporting workflow with bundleId to outputPath
   */
  public exportWorkflow(bundleId: string, outputPath: string) {
    return zipDirectory(getWorkflowInstalledPath(bundleId), outputPath);
  }

  /**
   * @param  {string} bundleId?
   * @summary Renew workflows info based on workflowInstallPath's arvis-workflow.json
   *          This funtion is called by file watcher if arvis-workflow.json's changes are detected.
   * @description If bundleId is given, renew only that workflow info.
   */
  public async renewWorkflows(bundleId?: string) {
    return new Promise((resolve, reject) => {
      this.setStoreAvailability(false);
      recursiveReaddir(workflowInstallPath, async (err, files) => {
        if (err) {
          reject(err);
          this.setStoreAvailability(true);
          return;
        }

        files = files.filter((filePath) => {
          if (bundleId)
            return filePath.endsWith(
              `${bundleId}${path.sep}arvis-workflow.json`
            );
          return filePath.endsWith('arvis-workflow.json');
        });

        const workflowInfoArr: any[] = [];
        const readJsonPromises: Promise<any>[] = [];

        for (const workflow of files) {
          try {
            readJsonPromises.push(fse.readJson(workflow));
          } catch (err) {
            this.setStoreAvailability(true);
            throw new Error('Arvis workflow file format error' + err);
          }
        }

        for await (const workflowInfo of readJsonPromises) {
          workflowInfoArr.push(workflowInfo);
        }

        // if (!bundleId) this.store = new Map<string, any>();
        if (!bundleId) {
          this.clearWorkflowsInfo();
        }

        for (const workflowInfo of workflowInfoArr) {
          this.setWorkflow(workflowInfo);
        }

        this.setStoreAvailability(true);
        resolve(true);
      });
    });
  }

  /**
   * @param  {boolean} initializePluginWorkspace
   * @param  {string} bundleId?
   * @summary Renew plugins info based on pluginInstallPath's arvis-plugin.json
   *          This funtion is called by file watcher if arvis-plugin.json's changes are detected.
   * @description If bundleId is given, renew only that plugin info.
   */
  public renewPlugins = async ({
    initializePluginWorkspace,
    bundleId,
  }: {
    initializePluginWorkspace: boolean;
    bundleId?: string;
  }) => {
    return new Promise((resolve, reject) => {
      this.setStoreAvailability(false);
      recursiveReaddir(pluginInstallPath, async (err, files) => {
        if (err) {
          reject(err);
          this.setStoreAvailability(true);
          return;
        }

        files = files.filter((filePath) => {
          if (bundleId)
            return filePath.endsWith(`${bundleId}${path.sep}arvis-plugin.json`);
          return filePath.endsWith('arvis-plugin.json');
        });

        const pluginInfoArr: any[] = [];
        const readJsonPromises: Promise<any>[] = [];

        for (const pluginJson of files) {
          try {
            readJsonPromises.push(fse.readJson(pluginJson));
          } catch (err) {
            this.setStoreAvailability(true);
            throw new Error('Arvis plugin file format error' + err);
          }
        }

        for await (const pluginInfo of readJsonPromises) {
          pluginInfoArr.push(pluginInfo);
        }

        const newPluginDict: any = bundleId ? this.getPlugins() : {};
        for (const pluginInfo of pluginInfoArr) {
          newPluginDict[pluginInfo.bundleId] = pluginInfo;
        }

        this.store.set('plugins', newPluginDict);

        if (initializePluginWorkspace) {
          pluginWorkspace.renew(pluginInfoArr);
        }
        this.setStoreAvailability(true);
        resolve(true);
      });
    });
  };

  /**
   * @param  {} {}
   */
  public getInstalledWorkflows() {
    return this.getter('workflows', {});
  }

  /**
   * @param  {} {}
   */
  public getCommands() {
    return this.getter('commands', {});
  }

  /**
   * @param  {} {}
   */
  public getHotkeys() {
    return this.getter('hotkeys', {});
  }

  /**
   * @param  {} {}
   */
  public getPlugins() {
    return this.getter('plugins', {});
  }

  /**
   * @param  {string} bundleId
   */
  public getWorkflow(bundleId: string) {
    return this.getInstalledWorkflows()[bundleId];
  }

  /**
   * @param  {any} workflow
   */
  public setPlugin(plugin: any) {
    this.store.set('plugins', {
      ...this.getPlugins(),
      [plugin.bundleId]: plugin,
    });
  }

  /**
   * @param  {any} workflow
   */
  public setWorkflow(workflow: any) {
    // Update workflow installation info
    const installedWorkflows = this.getInstalledWorkflows();
    installedWorkflows[workflow.bundleId] = workflow;
    this.store.set('workflows', installedWorkflows);

    // Update available commands
    let commands = this.getCommands();
    commands = removeOldCommand(commands, workflow.bundleId);
    commands = addCommands(commands, workflow.commands, workflow.bundleId);
    this.store.set('commands', commands);

    // Update available hotkeys
    let hotkeys = _.pickBy(
      workflow.commands,
      (command) => command.type === 'hotkey'
    );

    hotkeys = _.map(hotkeys, (command) => {
      return {
        bundleId: workflow.bundleId,
        ...command,
      };
    });

    hotkeys = _.keyBy(hotkeys, (item) => item.hotkey);
    this.store.set('hotkeys', { ...hotkeys, ...this.getHotkeys() });
  }

  /**
   * @param  {string} bundleId
   * @summary Called to unInstaller to remove information from the workflow from the Store
   */
  public deleteWorkflow(bundleId: string) {
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
  }
}
