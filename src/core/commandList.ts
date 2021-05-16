import { Store } from '../config/store';

/**
 * @param  {}
 * @summary Find available workflow commands
 */
const getCommandList = () => {
  const store = Store.getInstance();
  return store.getCommands();
};

export {
  getCommandList
};