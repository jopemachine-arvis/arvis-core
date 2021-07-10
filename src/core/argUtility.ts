import { log, LogType } from '../config';
import { ActionFlowManager } from './actionFlowManager';

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
}): boolean => {
  const actionFlowManager = ActionFlowManager.getInstance();

  if (!actionFlowManager.isInitialTrigger) {
    if (inputStr === '') return false;
    return true;
  }

  // argType's default value is optional
  // 'optional', 'no' always return true.
  if (item.argType === 'required') {
    // e.g. "npm query".split("npm") => ["", " query"].

    const [_emptyStr, ...querys] = inputStr.split(item.command);
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
  const [_emptyStr, ...querys] = inputStr.split(item.command);
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
}): boolean => {
  if (item.type === 'scriptFilter') {
    const actionFlowManager = ActionFlowManager.getInstance();
    const targetStr = actionFlowManager.isInitialTrigger ? item.command : actionFlowManager.getTopTrigger().input;

    if (!targetStr) return true;

    const { withspace } = item;

    const withWithspace =
      withspace &&
      (inputStr === targetStr || inputStr.includes(`${targetStr} `));

    const withoutWithspace = !withspace && inputStr.includes(targetStr!);

    if (!withWithspace && !withoutWithspace) return false;
    return true;
  }

  log(
    LogType.error,
    '"meetWithspaceCond" is called from not scriptFilter item'
  );
  return false;
};
