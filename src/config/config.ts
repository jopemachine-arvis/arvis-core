import _ from 'lodash';
import { StoreType } from '../types/storeType';

const schema = {
  installed: {
    type: "object",
    default: {},
  },
  commands: {
    type: "object",
    default: {},
  },
} as const;

const createStore = async (storeType: StoreType) => {

  let store;
  if (storeType === StoreType.Electron) {
    const ElectronStore = await import("electron-store");
    store = new ElectronStore.default({ schema, name: "common" });
  } else if (storeType === StoreType.CUI) {
    const CuiStore = await import("conf");
    store = new CuiStore.default({ schema, configName: "common" });
  } else {
    throw new Error("conf store type not correct");
  }

  const Functions = {
    getInstalledWorkflows: () => {
      return store.get("installed") as any;
    },

    getCommands: () => {
      return store.get("commands") as any;
    },

    getWorkflow: (bundleId: string) => {
      return Functions.getInstalledWorkflows()[bundleId];
    },

    setWorkflow: (workflow: any) => {
      const installedWorkflows = Functions.getInstalledWorkflows();
      installedWorkflows[workflow.bundleId] = workflow;
      store.set("installed", installedWorkflows);
      const commands = Functions.getCommands();
      for (const commandObj of workflow.commands) {
        commandObj.bundleId = workflow.bundleId;
        const existing = commands[commandObj.command];
        commands[commandObj.command] = existing
          ? [...existing, commandObj]
          : [commandObj];
      }
      store.set("commands", commands);
    },

    deleteWorkflow: (bundleId: string) => {
      const installedWorkflows = Functions.getInstalledWorkflows();
      delete installedWorkflows[bundleId];
      store.set("installed", installedWorkflows);
      const allCommands = Functions.getCommands();
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
      store.set("commands", allCommands);
    },
  };

  return Functions;
};

export {
  createStore
};
