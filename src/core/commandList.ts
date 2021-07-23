import { Store } from '../config/store';

/**
 * Find available workflow commands
 * @returns commandList
 */
export const getCommandList = (): Record<string, Command[]> => {
  const store = Store.getInstance();
  return store.getCommands();
};
