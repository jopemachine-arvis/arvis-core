import execa, { ExecaError, ExecaReturnValue } from 'execa';
import { log, LogType } from '../config';
import { extractVarEnv } from '../config/envHandler';
import { execute } from '../core';
import { ActionFlowManager } from '../core/actionFlowManager';
import { applyArgsToScript } from '../core/argsHandler';
import { extractScriptOnThisPlatform } from '../core/scriptExtracter';

/**
 * @param err
 */
const scriptErrorHandler = (err: ExecaError): void => {
  if (err.timedOut) {
    log(LogType.error, `Script Timeout!`);
  } else if (err.isCanceled) {
    log(LogType.error, `Script Canceled`);
  } else {
    log(LogType.error, `Script Error\n\n${err}`);
  }
};

/**
 * @param action
 * @param queryArgs
 */
export const handleScriptAction = async (action: ScriptAction, queryArgs: Record<string, any>): Promise<ExecaReturnValue<string> | void> => {
  const actionFlowManager = ActionFlowManager.getInstance();
  const { script: scriptStr, shell } = extractScriptOnThisPlatform(
    action.script
  );

  try {
    const result: execa.ExecaReturnValue<string> = await execute({
      bundleId: actionFlowManager.getTopTrigger().bundleId,
      scriptStr: applyArgsToScript({ script: scriptStr, queryArgs }),
      vars: extractVarEnv(queryArgs),
      options: { all: true, shell },
    });

    if (actionFlowManager.printScriptOutput) {
      if (result.all && result.all.trim() !== '') {
        log(LogType.info, `[Script output]\n\n${result.all}`);
      } else {
        log(LogType.info, `[Script output] script ends and no print output`);
      }
    }
  } catch (err) {
    scriptErrorHandler(err);
  }
};
