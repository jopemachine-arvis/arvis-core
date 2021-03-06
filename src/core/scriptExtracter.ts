import { log, LogType } from '../config';

/**
 * If 'scriptStrOrDict' is string, return the script.
 * If 'scriptStrOrDict' is object, Extract and return the script, shell option of this platform.
 * @param scriptStrOrDict
 */
export const extractScriptOnThisPlatform = (
  scriptStrOrDict: string | Readonly<Record<string, any>>
): {
  script: string;
  shell: boolean | string;
} => {
  let script: string = '';
  let shell: boolean | string = false;

  if (typeof scriptStrOrDict === 'string') {
    script = scriptStrOrDict as string;
  } else if (!scriptStrOrDict[process.platform]) {
    log(LogType.error, `Proper script for '${process.platform}' not exist!`);
  } else if (typeof scriptStrOrDict[process.platform] === 'string') {
    script = scriptStrOrDict[process.platform];
    shell = (scriptStrOrDict as any).shell ?? false;
  } else {
    script = scriptStrOrDict[process.platform].script;
    shell = scriptStrOrDict[process.platform].shell ?? false;
  }

  return {
    script,
    shell,
  };
};