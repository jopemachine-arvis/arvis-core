import execa from 'execa';
import { getCommandList } from './commandList';
import _ from 'lodash';
import path from 'path';

const findCommands = (command: string) => {
  const commands = getCommandList();

  const filtered = [] as any;
  for (const item of Object.keys(commands)) {
    if (item.startsWith(command)) {
      filtered.push(...commands[item]);
    }
  }

  return filtered;
};

const execute = async (bundleId: string, command: string) => {
  const execPath = path.resolve(`./installed/${bundleId}`);

  const { stdout } = await execa.command(command, {
    cwd: execPath,
    env: {
      // Setting for alfy compatibility
      'alfred-workflow-cache': bundleId
    },
  });
  return stdout.toString();
};

export {
  execute,
  findCommands
};