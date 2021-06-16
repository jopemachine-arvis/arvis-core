import { log, LogType } from '../config';
import { WorkManager } from './workManager';

/**
 * @param  {{item:any;inputStr:string;}}
 * @description Return true if item should be executed depending on argType
 */
export const hasRequiredArg = ({
  item,
  inputStr,
}: {
  item: any;
  inputStr: string;
}) => {
  // argType's default value is optional
  // 'optional', 'no' always return true.
  if (item.argType === 'required') {
    const [command, ...querys] = inputStr.split(item.command);
    if (!querys) return false;
    return querys.length >= 1;
  }

  return true;
};

/**
 * @param  {{item:any;inputStr:string;}}
 */
export const isInputMeetWithspaceCond = ({
  item,
  inputStr,
}: {
  item: any;
  inputStr: string;
}) => {
  if (item.type === 'scriptFilter') {
    const workManager = WorkManager.getInstance();

    if (workManager.hasNestedScriptFilters()) {
      return true;
    }

    const { withspace } = item;

    const withWithspace =
      withspace &&
      (inputStr === item.command || inputStr.includes(`${item.command} `));

    const withoutWithspace = !withspace && inputStr.includes(item.command!);

    if (!withWithspace && !withoutWithspace) return false;
    return true;
  }

  log(
    LogType.error,
    '"meetWithspaceCond" is called from not scriptFilter item'
  );
  return false;
};
