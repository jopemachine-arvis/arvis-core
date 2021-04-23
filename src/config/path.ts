import envPathsGenerator from 'env-paths';

const envPaths = envPathsGenerator('wf-creator');
const workflowInstallPath = envPaths.data;

export {
  workflowInstallPath,
};

export default {
  workflowInstallPath,
};
