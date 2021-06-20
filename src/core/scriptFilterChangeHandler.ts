import execa from '../../execa';
import { log, LogType } from '../config';
import { extractVarEnv } from '../config/envHandler';

import { applyArgsToScript } from './argsHandler';
import { execute } from './scriptExecutor';
import { extractScriptOnThisPlatform } from './scriptExtracter';
import { WorkManager } from './workManager';

type ScriptFilterChangeHandlerOption = {
  timeout?: number;
  shell?: boolean | string;
};

/**
 * @param  {string} bundleId
 * @param  {Command} command
 * @param  {object} queryArgs
 * @param  {ScriptFilterChangeHandlerOption} options?
 * @return {execa.ExecaChildProcess<string>} Executed process
 */
const handleScriptFilterChange = (
  bundleId: string,
  command: Command | PluginItem | Action,
  queryArgs: object,
  options?: ScriptFilterChangeHandlerOption
): execa.ExecaChildProcess<string> => {
  if (command.type !== 'scriptFilter') {
    throw new Error(`Command is not scriptfilter! ${command}`);
  }

  const { script, shell } = extractScriptOnThisPlatform(
    (command as ScriptFilterAction).scriptFilter!
  );

  const scriptStr = applyArgsToScript({
    scriptStr: script,
    queryArgs,
  });

  const workManager = WorkManager.getInstance();

  if (workManager.printScriptfilter) {
    log(LogType.info, '[SF Script]', scriptStr);
  }

  const vars = extractVarEnv(queryArgs);

  return execute({ bundleId, scriptStr, vars, options: { ...options, shell } });
};

export { handleScriptFilterChange };
