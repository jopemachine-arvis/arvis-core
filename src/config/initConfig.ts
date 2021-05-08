const Conf = require('conf');

export default () => {
  const config = new Conf();
  config.set('workflows', {});
  config.set('plugins', {});
  config.set('hotkeys', {});
  config.set('commands', {});
};
