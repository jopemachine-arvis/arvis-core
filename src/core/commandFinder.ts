import { getCommandList } from "./commandList";

const findCommands = (command: string) => {
  const commands = getCommandList();

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
