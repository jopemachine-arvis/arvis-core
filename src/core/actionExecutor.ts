import execa from 'execa';
import { getCommandList } from './commandList';
import _ from 'lodash';

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

const execute = async (command: string) => {
  const target = findCommands(command)[0];
  const script = target.action.script;

  const [program, ...args] = script.split(' ');
  const { stdout } = await execa(program, args);
  return stdout.toString();
};

export {
  execute,
  findCommands
};