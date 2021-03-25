import execa from 'execa';
import _ from 'lodash';
import path from 'path';

const execute = (bundleId: string, command: string) => {
  const execPath = path.resolve(`.${path.sep}installed${path.sep}${bundleId}`);

  return execa.command(command, {
    cwd: execPath,
    env: {
      // Setting for alfy compatibility
      'alfred_workflow_cache': bundleId
    },
  });
};

export {
  execute,
};