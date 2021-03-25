import execa from 'execa';
import _ from 'lodash';
import path from 'path';

const execute = async (bundleId: string, command: string) => {
  const execPath = path.resolve(`.${path.sep}installed${path.sep}${bundleId}`);

  const { stdout } = await execa.command(command, {
    cwd: execPath,
    env: {
      // Setting for alfy compatibility
      'alfred_workflow_cache': bundleId
    },
  });
  return stdout.toString();
};

export {
  execute,
};