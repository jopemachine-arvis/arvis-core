import Conf from 'conf';
import _ from 'lodash';

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

const conf = new Conf({ schema });

const getInstalledWorkflows = () => {
  return (conf.get('installed') as any);
};

const getCommands = () => {
  return (conf.get('commands') as any);
};

const getWorkflow = (bundleId: string) => {
  return getInstalledWorkflows()[bundleId];
};

const setWorkflow = (workflow: any) => {
  const installedWorkflows = getInstalledWorkflows();
  installedWorkflows[workflow.bundleId] = workflow;
  conf.set('installed', installedWorkflows);
  const commands = getCommands();
  for (const commandObj of workflow.commands) {
    commandObj.bundleId = workflow.bundleId;
    const existing = commands[commandObj.command];
    commands[commandObj.command] = existing
      ? [...existing, commandObj]
      : [commandObj];
  }
  conf.set('commands', commands);
};

const deleteWorkflow = (bundleId: string) => {
  const installedWorkflows = getInstalledWorkflows();
  installedWorkflows[bundleId] = undefined;
  conf.set('installed', installedWorkflows);
  const commands = getCommands();
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

  conf.set('commands', commands);
};

export {
  getCommands,
  getInstalledWorkflows,
  getWorkflow,
  setWorkflow,
  deleteWorkflow,
  conf
};