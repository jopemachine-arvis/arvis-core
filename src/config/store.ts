import fse from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import recursiveReaddir from 'recursive-readdir';
import { zipDirectory } from '../utils/zip';
import { getWorkflowInstalledPath, workflowInstallPath } from './path';

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

const addCommands = (commands: object, newCommands: any[], bundleId: string) => {
  const ret = commands;
  for (const commandObj of newCommands) {
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
  store: Map<string, any>;

  private constructor() {
    this.store = new Map<string, any>();
  }

  static getInstance() {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  exportWorkflow (bundleId: string, outputPath: string) {
    zipDirectory(getWorkflowInstalledPath(bundleId), outputPath);
  }

  async renewWorkflows (bundleId?: string) {
    if (!bundleId) this.store = new Map<string, any>();

    return new Promise((resolve, reject) => {
      recursiveReaddir(workflowInstallPath, async (err, files) => {
        if (err) {
          reject(err);
          return;
        }

        files = files.filter((filePath) => {
          if (bundleId)
            return filePath.endsWith(
              `${bundleId}${path.sep}arvis-workflow.json`
            );
          return filePath.endsWith('arvis-workflow.json');
        });

        for (const workflow of files) {
          try {
            const workflowInfo = await fse.readJson(workflow);
            this.setWorkflow(workflowInfo);
          } catch (err) {
            throw new Error(err);
          }
        }
        resolve(true);
      });
    });
  }

  getter(key: string, defaultValue: any) {
    if (this.store.has(key)) {
      return this.store.get(key) as any;
    } else return defaultValue;
  }

  getInstalledWorkflows () {
    return this.getter('workflows', {});
  }

  getCommands () {
    return this.getter('commands', {});
  }

  getHotkeys () {
    return this.getter('hotkeys', {});
  }

  getWorkflow (bundleId: string) {
    return this.getInstalledWorkflows()[bundleId];
  }

  setWorkflow (workflow: any) {
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

  deleteWorkflow (bundleId: string) {
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
    const hotkeys = _.pickBy(availableHotkeys, hotkey => hotkey.bundleId !== bundleId);

    this.store.set('hotkeys', hotkeys);
  }
}
