import envPathsGenerator from 'env-paths';

const envPaths = envPathsGenerator('arvis');
const workflowInstallPath = envPaths.data;

export {
  workflowInstallPath,
};

export default {
  workflowInstallPath,
};
