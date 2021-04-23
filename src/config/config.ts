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
    const ElectronStore = await import('electron-store');
    store = new ElectronStore.default({ schema });
  } else if (storeType === StoreType.CUI) {
    const CuiStore = await import('conf');
    store = new CuiStore.default({ schema });
  } else {
    throw new Error('conf store type not correct');
  }

  const Functions = {
    getInstalledWorkflows: () => {
      return (store.get('installed') as any);
    },

    getCommands: () => {
      return (store.get('commands') as any);
    },

    getWorkflow: (bundleId: string) => {
      return Functions.getInstalledWorkflows()[bundleId];
    },

    setWorkflow: (workflow: any) => {
      const installedWorkflows = Functions.getInstalledWorkflows();
      installedWorkflows[workflow.bundleId] = workflow;
      store.set('installed', installedWorkflows);
      const commands = Functions.getCommands();
      for (const commandObj of workflow.commands) {
        commandObj.bundleId = workflow.bundleId;
        const existing = commands[commandObj.command];
        commands[commandObj.command] = existing
          ? [...existing, commandObj]
          : [commandObj];
      }
      store.set('commands', commands);
    },

    deleteWorkflow: (bundleId: string) => {
      const installedWorkflows = Functions.getInstalledWorkflows();
      installedWorkflows[bundleId] = undefined;
      store.set('installed', installedWorkflows);
      const commands = Functions.getCommands();
      for (const command of Object.keys(commands)) {
        const commandRecords = commands[command];

        // tslint:disable-next-line: forin
        for (const commandRecordIdx in commandRecords) {
          // Delete all command which bundle id equals `bundleId`
          if (commandRecords[commandRecordIdx].bundleId === bundleId) {
            commandRecords.splice(commandRecordIdx, 1);
          }
          if (commandRecords.length === 0) {
            delete commands[command];
          }
        }
      }

      store.set('commands', commands);
    },
  };

  return Functions;
};

export {
  createStore
};
