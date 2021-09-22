const fse = require('fs-extra');
const pCancelable = require('./pCancelable');

const buildPluginExecutor = async () => {
  const pluginExecutor = await fse.readFile('./scripts/pluginExecutor.js', { encoding: 'utf-8' });

  const pluginExecutorStr =
    `${pCancelable}

${pluginExecutor.toString()}`;

  await fse.writeJSON('./assets/pluginExecutor.json', {
    pluginExecutor: pluginExecutorStr
  }, { encoding: 'utf-8', spaces: 4 });
};

const buildScriptExecutor = async () => {
  const scriptExecutor = await fse.readFile('./scripts/scriptExecutor.js', { encoding: 'utf-8' });

  await fse.writeJSON('./assets/scriptExecutor.json', {
    scriptExecutor
  }, { encoding: 'utf-8', spaces: 4 });
};

// Build scripts to strings (json)
(async () => {
  await buildPluginExecutor();
  await buildScriptExecutor();
})();
