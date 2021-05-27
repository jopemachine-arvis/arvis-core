import { log, LogType } from '../config';
import '../types';
import { applyArgsToScript } from './argsHandler';
import { execute } from './scriptExecutor';
import { extractScriptOnThisPlatform } from './scriptExtracter';
import { WorkManager } from './workManager';

type ScriptFilterChangeHandlerOption = {
  timeout?: number;
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
) => {
  if (command.type !== 'scriptfilter') {
    throw new Error(`Command is not scriptfilter! ${command}`);
  }

  const script = (command as ScriptFilterAction).script_filter!;

  const scriptStr = applyArgsToScript({
    scriptStr: extractScriptOnThisPlatform(script),
    queryArgs,
  });

  const workManager = WorkManager.getInstance();

  if (workManager.printScriptfilter) {
    log(LogType.info, '[SF Script]', scriptStr);
  }

  return execute({ bundleId, scriptStr, options });
};

export { handleScriptFilterChange };
