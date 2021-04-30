const Conf = require('conf');

export default () => {
  const config = new Conf();
  config.set('installed', {});
  config.set('commands', {});
};
