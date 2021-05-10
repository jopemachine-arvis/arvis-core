import { execute } from '../actions/scriptExecution';
import '../types';
import { escapeBraket } from '../utils';
import { applyArgsToScript } from './argsHandler';
import { WorkManager } from './workManager';

type ScriptFilterChangeHandlerOption = {
  timeout?: number;
};

const handleScriptFilterChange = (
  bundleId: string,
  command: Command,
  queryArgs: object,
  options?: ScriptFilterChangeHandlerOption,
) => {
  if (command.type !== 'scriptfilter') {
    throw new Error(`Command is not scriptfilter! ${command}`);
  }

  // const script = command.script_filter!.split(' ').map(escapeBraket).join(' ');
  const script = command.script_filter!;

  const scriptStr = applyArgsToScript({ scriptStr: script, queryArgs });

  const workManager = WorkManager.getInstance();

  if (workManager.printScriptfilter) {
    console.log('[SF Script]', scriptStr);
  }

  return execute(bundleId, scriptStr, options);
};

export { handleScriptFilterChange };
