import { Store } from '../config/store';

/**
 * @param  {}
 * @returns {Record<string, Command[]>} commandList
 * @summary Find available workflow commands
 */
export const getCommandList = (): Record<string, Command[]> => {
  const store = Store.getInstance();
  return store.getCommands();
};
