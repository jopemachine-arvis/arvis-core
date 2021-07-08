import execa, { ExecaError } from 'execa';
import { log, LogType } from '../config';
import { extractVarEnv } from '../config/envHandler';
import { execute } from '../core';
import { applyArgsToScript } from '../core/argsHandler';
import { extractScriptOnThisPlatform } from '../core/scriptExtracter';
import { WorkManager } from '../core/workManager';

/**
 * @param  {ExecaError} err
 */
const scriptErrorHandler = (err: ExecaError) => {
  if (err.timedOut) {
    log(LogType.error, `Script timeout!`);
  } else if (err.isCanceled) {
    log(LogType.error, `Script canceled`);
  } else {
    log(LogType.error, `Script Error\n\n${err}`);
  }
};

/**
 * @param  {ScriptAction} action
 * @param  {Record<string, any>} queryArgs
 */
const handleScriptAction = async (action: ScriptAction, queryArgs: Record<string, any>) => {
  const workManager = WorkManager.getInstance();
  const { script: scriptStr, shell } = extractScriptOnThisPlatform(
    action.script
  );

  const scriptWork = execute({
    bundleId: workManager.getTopWork().bundleId,
    scriptStr: applyArgsToScript({ script: scriptStr, queryArgs }),
    vars: extractVarEnv(queryArgs),
    options: { all: true, shell },
  });

  return scriptWork
    .then((result: execa.ExecaReturnValue<string>) => {
      if (workManager.printScriptOutput) {
        if (result.all && result.all.trim() !== '') {
          log(LogType.info, `[Script output]\n\n${result.all}`);
        }
      }
      return result;
    })
    .catch(scriptErrorHandler);
};

export { handleScriptAction };
