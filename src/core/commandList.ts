import { Store } from '../config/store';

/**
 * @param  {}
 */
const getCommandList = () => {
  const store = Store.getInstance();
  return store.getCommands();
};

export {
  getCommandList
};