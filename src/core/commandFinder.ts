import { getCommandList } from "./commandList";

const findCommands = (command: string) => {
  const commands = getCommandList();

  const filtered = [] as any;
  for (const item of Object.keys(commands)) {
    if (item.startsWith(command.trimRight())) {
      filtered.push(...commands[item]);
    }
  }

  return filtered;
};

export { findCommands };
