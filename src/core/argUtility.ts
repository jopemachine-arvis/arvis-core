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
    // e.g. "npm query".split("npm") => ["", " query"]
    const [emptyStr, ...querys] = inputStr.split(item.command);
    if (!querys) return false;
    // There must be valid input (Assume only whitespaces are not valid)
    return querys.length >= 1 && querys[0].trim() !== '';
  }

  return true;
};

/**
 * @param  {{item:any;inputStr:string;}}
 */
export const isArgTypeNoButHaveArg = ({
  item,
  inputStr,
}: {
  item: any;
  inputStr: string;
}): boolean | undefined => {
  // argType's default value is optional
  const [emptyStr, ...querys] = inputStr.split(item.command);
  if (item.argType === 'no') {
    if (querys.length >= 1 && querys[0] !== '') return true;
  }

  return false;
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
