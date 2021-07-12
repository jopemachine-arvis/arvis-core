import { Store } from '../config/store';

/**
 * @param  {}
 * @summary Find available workflow commands
 */
export const getCommandList = (): Record<string, Command[]> => {
  const store = Store.getInstance();
  return store.getCommands();
};
