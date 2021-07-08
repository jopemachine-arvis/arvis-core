// tslint:disable: no-string-literal
import chalk from 'chalk';
import execa, { ExecaError, ExecaReturnValue } from 'execa';
import _ from 'lodash';
import PCancelable from 'p-cancelable';
import parseJson from 'parse-json';
import { log, LogType, pushInputStrLog } from '../config';
import {
  getPluginList,
  getWorkflowList,
  WorkManager,
  xmlToJsonScriptFilterItemFormat,
} from '../core';
import { applyExtensionVars, extractArgsFromQuery } from '../core/argsHandler';
import { handleScriptFilterChange } from '../core/scriptFilterChangeHandler';

/**
 * @summary
 */
const printActionLog = (): void => {
  const workManager = WorkManager.getInstance();
  if (workManager.printActionType) {
    if (workManager.loggerColorType === 'gui') {
      log(
        LogType.info,
        `%c[Action: scriptfilter]%c `,
        'color: red',
        'color: unset',
        workManager.getTopWork().actionTrigger
      );
    } else {
      log(
        LogType.info,
        chalk.redBright(`[Action: scriptfilter] `),
        workManager.getTopWork().actionTrigger
      );
    }
  }
};

/**
 * @param  {string} stdout
 */
const parseStdio = (stdout: string, stderr: string): ScriptFilterResult => {
  if (stdout.startsWith('<?xml')) {
    try {
      console.error(
        'Warning: XML scriptfilter format supporting could have defects yet.'
      );

      return xmlToJsonScriptFilterItemFormat(stdout, stderr);
    } catch (err) {
      const error = new Error(
        `XML Scriptfilter format error!\n${err}\n\nstdout: ${stdout}\n\nstderr: ${stderr}\n`
      );
      error['extractJson'] = false;
      throw error;
    }
  } else {
    try {
      return parseJson(stdout) as ScriptFilterResult;
    } catch (err) {
      const error = new Error(
        `JSON Scriptfilter format error!\n${err}\n\nstdout: ${stdout}\n\nstderr: ${stderr}\n`
      );
      error['extractJson'] = false;
      throw error;
    }
  }
};

/**
 * @param  {execa.ExecaReturnValue<string>} result
 * @description Event Handler when scriptfilter's script is complete
 */
function scriptFilterCompleteEventHandler(
  scriptFilterResult: execa.ExecaReturnValue<string>
): void {
  const workManager = WorkManager.getInstance();

  const stdio = parseStdio(
    scriptFilterResult.stdout,
    scriptFilterResult.stderr
  );

  workManager.printScriptfilter && log(LogType.info, '[SF Result]', stdio);

  const { items, rerun: rerunInterval, variables } = stdio;

  workManager.updateTopWork({
    items,
    rerunInterval,
    workCompleted: true,
    globalVariables: {
      ...variables,
      ...workManager.globalVariables,
    },
  });

  const { bundleId } = workManager.getTopWork();

  const infolist =
    workManager.extensionInfo!.type === 'workflow'
      ? getWorkflowList()
      : getPluginList();

  const defaultIcon = infolist[bundleId].defaultIcon;

  items.map((item: ScriptFilterItem) => {
    // Append bundleId to each ScriptFilterItem.
    item.bundleId = bundleId;
    // Append workflow's defaultIcon
    item.icon = item.icon ?? defaultIcon;
  });

  if (!workManager.onItemShouldBeUpdate) {
    throw new Error('Renderer update funtions are not set!');
  }

  workManager.onItemShouldBeUpdate({ items, needIndexInfoClear: true });
}

/**
 * @param  {Error} err
 * @description Handler when scriptfilter's script fails
 */
function scriptErrorHandler(
  err: ExecaError,
  options?: { extractJson?: boolean } | undefined
): void {
  const workManager = WorkManager.getInstance();

  if (err.timedOut) {
    log(LogType.error, `Script timeout!\n'${err}`);
  } else if (err.isCanceled) {
    // Command was canceled by other scriptfilter.
  } else {
    if (workManager.hasEmptyWorkStk()) {
      // Command was canceled by user.
    } else {
      log(LogType.error, err);
      workManager.handleScriptFilterError(err, options);
    }
  }
}

/**
 * @param  {string} inputStr
 * @param  {string|undefined} command
 * @param  {boolean} withspace
 */
const getScriptFilterQuery = (
  inputStr: string,
  command: string | undefined,
  withspace: boolean
): string[] => {
  const workManager = WorkManager.getInstance();
  if (!workManager.isInitialTrigger) {
    return inputStr.split(' ');
  }

  const targetCommand = withspace ? command! + ' ' : command!;
  const arr = inputStr.split(targetCommand);
  return arr.slice(1, arr.length).join(targetCommand).split(' ');
};

/**
 * @param  {string} inputStr
 * @param  {Command} commandObj? command object should be given when stack is empty
 */
async function scriptFilterExcute(
  inputStr: string,
  commandObj?: Command
): Promise<void | ExecaReturnValue<string>> {
  // If WorkStk is empty, users can enter the script filter without a return event.
  // To handle this, push this command to WorkStk
  const workManager = WorkManager.getInstance();

  // To do:: Change below code with 'workManager.isInitialTrigger'
  if (workManager.hasEmptyWorkStk()) {
    if (!commandObj) {
      throw new Error('Error - command should be given when stack is empty');
    }
    workManager.pushWork({
      type: 'scriptFilter',
      input: inputStr,
      actions: commandObj.actions,
      actionTrigger: commandObj,
      bundleId: commandObj.bundleId!,
      args: {},
      workProcess: null,
      workCompleted: false,
    });

    pushInputStrLog(commandObj.command!);
    workManager.setExtensionInfo(commandObj);
  } else {
    const newScriptFilterNeedsToExecuted =
      workManager.getTopWork().type === 'scriptFilter' &&
      workManager.getTopWork().workProcess &&
      !workManager.getTopWork().workCompleted;

    if (newScriptFilterNeedsToExecuted) {
      workManager.getTopWork().workProcess!.cancel();
    }
  }

  if (workManager.rerunTimer) {
    clearInterval(workManager.rerunTimer);
  }

  const { bundleId, actionTrigger } = workManager.getTopWork();

  const withspace: boolean = commandObj
    ? commandObj.withspace ?? true
    : actionTrigger['withspace'] ?? true;

  const command: string | undefined = commandObj
    ? commandObj!.command
    : actionTrigger['command'];

  const querys: string[] = getScriptFilterQuery(inputStr, command, withspace);

  // If the ScriptFilters are nested, the first string element is query.
  // Otherwise, the first string element is command.

  const extensionVariables: Record<string, any> =
    workManager.extensionInfo!.type === 'plugin'
      ? getPluginList()[bundleId].variables
      : getWorkflowList()[bundleId].variables ?? {};

  const extractedArgs: Record<string, any> = applyExtensionVars(
    extractArgsFromQuery(querys),
    extensionVariables
  );

  const scriptWork: PCancelable<execa.ExecaReturnValue<string>> =
    new PCancelable((resolve, _reject, onCancel) => {
      const proc: execa.ExecaChildProcess<string> = handleScriptFilterChange(
        bundleId,
        // Assume
        actionTrigger as Command | Action | PluginItem,
        extractedArgs
      );
      proc.then(resolve).catch((err: ExecaError) =>
        scriptErrorHandler(err, { extractJson: err['extractJson'] ?? true })
      );
      proc.unref();
      onCancel(() => proc.cancel());
    });

  workManager.updateTopWork({
    args: extractedArgs,
    workProcess: scriptWork,
  });

  return scriptWork
    .then((result) => {
      if (
        workManager.getTopWork().workProcess &&
        !workManager.getTopWork().workProcess!.isCanceled &&
        workManager.getTopWork().workProcess === scriptWork
      ) {
        printActionLog();
        scriptFilterCompleteEventHandler(result);
        if (workManager.getTopWork().rerunInterval) {
          // Run recursive every rerunInterval
          workManager.rerunTimer = setTimeout(() => {
            scriptFilterExcute(inputStr);
          }, workManager.getTopWork().rerunInterval);
        }
      }
      return result;
    })
    .catch((err) => {
      // In case of cancel command by user
      if (_.isUndefined(workManager.getTopWork())) return;
      if (!scriptWork.isCanceled) {
        console.error(`Unexpected Error occurs:\n\n${err}`);
        workManager.handleScriptFilterError(err, { extractJson: false });
      }
    });
}

export { scriptFilterExcute };
