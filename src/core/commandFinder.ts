import { StoreType } from '../types/storeType';
import { getCommandList } from './commandList';

const findCommands = async (storeType: StoreType, command: string) => {
  const commands = await getCommandList(storeType);

  const filtered = [] as any;
  for (const item of Object.keys(commands)) {
    // Same search result, no matter how many whitespace is attached to the right of command.
    if (item.startsWith(command.trimRight())) {
      filtered.push(...commands[item]);
    }
  }

  return filtered;
};

export { findCommands };
