import { log, LogType } from '../config';

/**
 * @param  {string | object} scriptStrOrDict
 * @return {string} scriptStr
 * @description If 'scriptStrOrDict' is string, return this.
 *              If 'scriptStrOrDict' is object, Extract and return the script of this platform.
 */
export const extractScriptOnThisPlatform = (
  scriptStrOrDict: string | object
): string => {
  // tslint:disable-next-line: no-string-literal
  if (scriptStrOrDict['length']) return scriptStrOrDict as string;
  if (!scriptStrOrDict[process.platform]) {
    log(LogType.error, `Proper script for '${process.platform}' not exist!`);
    return '';
  }
  return scriptStrOrDict[process.platform];
};
