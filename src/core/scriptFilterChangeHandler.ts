import execa from 'execa';
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
 * @param  {string} bundleId
 * @param  {Command} command
 * @param  {Record<string, any>} queryArgs
 * @param  {Readonly<ScriptFilterChangeHandlerOption>} options?
 * @returns {execa.ExecaChildProcess<string>} Executed process
 */
export const handleScriptFilterChange = (
  bundleId: string,
  command: Command | PluginItem | Action,
  queryArgs: Record<string, any>,
  options?: Readonly<ScriptFilterChangeHandlerOption>
): execa.ExecaChildProcess<string> => {
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
    log(LogType.info, '[SF Script]', scriptStr);
  }

  const vars: Record<string, any> = extractVarEnv(queryArgs);

  return execute({ bundleId, scriptStr, vars, options: { ...options, shell } });
};
