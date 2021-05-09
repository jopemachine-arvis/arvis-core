import { Store } from '../config/store';

const getCommandList = () => {
  const store = Store.getInstance();
  return store.getCommands();
};

export {
  getCommandList
};