import dotProp from 'dot-prop';
import fse from 'fs-extra';
import { getWorkflowConfigJsonPath } from '../config/path';
import { readJson5 } from '../utils';

/**
 * @param bundleId
 * @param actionPath
 * @param value
 */
export const updateWorkflowTrigger = async (
  bundleId: string,
  actionPath: string,
  value: string
): Promise<void> => {
  const workflowConfPath = getWorkflowConfigJsonPath(bundleId);
  const workflowConfig = await readJson5(workflowConfPath) as WorkflowConfigFile;
  const action: any = dotProp.get(workflowConfig, actionPath);

  switch (action.type) {
    case 'hotkey':
      action.hotkey = value;
      break;
    case 'keyword':
    case 'scriptFilter':
      action.command = value;
      break;
    default:
      throw new Error(
        `Invalid action type is detected!\n\nType: '${action.type}'`
      );
  }

  dotProp.set(workflowConfig, actionPath, action);

  await fse.writeJson(workflowConfPath, workflowConfig, {
    spaces: 4,
    encoding: 'utf8',
  });
};
