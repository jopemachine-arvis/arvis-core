import execa from 'execa';
import _ from 'lodash';
import path from 'path';

import { workflowInstallPath } from '../config/path';

const execute = (bundleId: string, command: string) => {
  const execPath = path.resolve(
    `${workflowInstallPath}${path.sep}installed${path.sep}${bundleId}`
  );

  // If it doesn't finish within the timeout time, an error is considered to have occurred.
  // Timeout time to should be changed.
  return execa.command(command, {
    cwd: execPath,
    env: {
      // Setting for 'alfy' compatibility
      'alfred_workflow_cache': bundleId
    },
    timeout: 3000,
  });
};

export {
  execute,
};