import execa from 'execa';
import PCancelable from 'p-cancelable';
import { log, LogType } from '../config';
import { extractVarEnv } from '../config/envHandler';
import { ActionFlowManager } from './actionFlowManager';
import { applyArgsToScript } from './argsHandler';
import { execute } from './scriptExecutor';
import { extractScriptOnThisPlatform } from './scriptExtracter';

type ScriptFilterChangeHandlerOption = {
  timeout?: number;
  shell?: boolean | string;
};

/**
 * @param bundleId
 * @param command
 * @param queryArgs
 * @param options?
 * @returns Executed process
 */
export const handleScriptFilterChange = (
  bundleId: string,
  command: Command | PluginItem | Action,
  queryArgs: Record<string, any>,
  options?: Readonly<ScriptFilterChangeHandlerOption>
): PCancelable<execa.ExecaReturnValue<string>> => {
  if (command.type !== 'scriptFilter') {
    throw new Error(`Command is not scriptfilter! ${command}`);
  }

  const { script, shell } = extractScriptOnThisPlatform(
    (command as ScriptFilterAction).scriptFilter!
  );

  const scriptStr: string = applyArgsToScript({
    script,
    queryArgs,
  });

  const actionFlowManager = ActionFlowManager.getInstance();

  if (actionFlowManager.printScriptfilter) {
    log(LogType.info, '[Scriptfilter Script]', scriptStr);
  }

  const vars: Record<string, any> = extractVarEnv(queryArgs);

  return execute({ bundleId, scriptStr, vars, options: { ...options, shell } });
};
