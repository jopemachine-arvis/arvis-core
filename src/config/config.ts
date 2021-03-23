import Conf from 'conf';
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
};

export {
  getCommands,
  getInstalledWorkflows,
  getWorkflow,
  setWorkflow,
  deleteWorkflow,
  conf
};