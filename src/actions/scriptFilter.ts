// tslint:disable: no-string-literal
import chalk from 'chalk';
import execa, { ExecaError, ExecaReturnValue } from 'execa';
import _ from 'lodash';
import PCancelable from 'p-cancelable';
import parseJson from 'parse-json';
import { log, LogType, pushInputStrLog } from '../config';
import {
  ActionFlowManager,
  getPluginList,
  getWorkflowList,
  resolveExtensionType,
  xmlToJsonScriptFilterItemFormat,
} from '../core';
import { applyExtensionVars, extractArgsFromQuery } from '../core/argsHandler';
import { handleScriptFilterChange } from '../core/scriptFilterChangeHandler';

/**
 * @summary
 */
const printActionLog = (): void => {
  const actionFlowManager = ActionFlowManager.getInstance();
  if (actionFlowManager.printActionType) {
    if (actionFlowManager.loggerColorType === 'gui') {
      log(
        LogType.info,
        `%c[Action: scriptfilter]%c `,
        'color: red',
        'color: unset',
        actionFlowManager.getTopTrigger().actionTrigger
      );
    } else {
      log(
        LogType.info,
        chalk.redBright(`[Action: scriptfilter] `),
        actionFlowManager.getTopTrigger().actionTrigger
      );
    }
  }
};

/**
 * @param  {string} stdout
 * @param  {string} stderr
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
const scriptFilterCompleteEventHandler = (
  scriptFilterResult: execa.ExecaReturnValue<string>
): void => {
  const actionFlowManager = ActionFlowManager.getInstance();

  const stdio = parseStdio(
    scriptFilterResult.stdout,
    scriptFilterResult.stderr
  );

  actionFlowManager.printScriptfilter && log(LogType.info, '[SF Result]', stdio);

  const { items, rerun: scriptfilterRerun, variables } = stdio;

  actionFlowManager.updateTopTrigger({
    items,
    scriptfilterRerun,
    scriptfilterCompleted: true,
    globalVariables: {
      ...variables,
      ...actionFlowManager.globalVariables,
    },
  });

  const { bundleId } = actionFlowManager.getTopTrigger();

  const infolist = resolveExtensionType() === 'workflow'
      ? getWorkflowList()
      : getPluginList();

  const defaultIcon = infolist[bundleId].defaultIcon;

  items.map((item: ScriptFilterItem) => {
    // Append bundleId to each ScriptFilterItem.
    item.bundleId = bundleId;
    // Append workflow's defaultIcon
    item.icon = item.icon ?? defaultIcon;
  });

  if (!actionFlowManager.onItemShouldBeUpdate) {
    throw new Error('Renderer update funtions are not set!');
  }

  actionFlowManager.onItemShouldBeUpdate({ items, needIndexInfoClear: true });
};

/**
 * @param  {Error} err
 * @description Handler when scriptfilter's script fails
 */
const scriptErrorHandler = (
  err: ExecaError,
  options?: { extractJson?: boolean } | undefined
): void => {
  const actionFlowManager = ActionFlowManager.getInstance();

  if (err.timedOut) {
    log(LogType.error, `Script timeout!\n'${err}`);
  } else if (err.isCanceled) {
    // Command was canceled by other scriptfilter.
  } else {
    if (actionFlowManager.hasEmptyTriggerStk()) {
      // Command was canceled by user.
    } else {
      log(LogType.error, err);
      actionFlowManager.handleScriptFilterError(err, options);
    }
  }
};

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
  const actionFlowManager = ActionFlowManager.getInstance();
  if (!actionFlowManager.isInitialTrigger) {
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
export async function scriptFilterExcute(
  inputStr: string,
  commandObj?: Readonly<Command>
): Promise<void | ExecaReturnValue<string>> {
  // If triggerStk is empty, users can enter the script filter without a return event.
  // To handle this, push this command to triggerStk
  const actionFlowManager = ActionFlowManager.getInstance();

  // To do:: Change below code with 'actionFlowManager.isInitialTrigger'
  if (actionFlowManager.hasEmptyTriggerStk()) {
    if (!commandObj) {
      throw new Error('Error - command should be given when stack is empty');
    }
    actionFlowManager.pushTrigger({
      type: 'scriptFilter',
      input: inputStr,
      actions: commandObj.actions,
      actionTrigger: commandObj,
      bundleId: commandObj.bundleId!,
      args: {},
      scriptfilterProc: null,
      scriptfilterCompleted: false,
    });

    pushInputStrLog(commandObj.bundleId!, commandObj.command!);
    actionFlowManager.setExtensionInfo(commandObj);
  } else {
    const newScriptFilterNeedsToExecuted =
      actionFlowManager.getTopTrigger().type === 'scriptFilter' &&
      actionFlowManager.getTopTrigger().scriptfilterProc &&
      !actionFlowManager.getTopTrigger().scriptfilterCompleted;

    if (newScriptFilterNeedsToExecuted) {
      actionFlowManager.getTopTrigger().scriptfilterProc!.cancel();
    }
  }

  if (actionFlowManager.rerunTimer) {
    clearInterval(actionFlowManager.rerunTimer);
  }

  const { bundleId, actionTrigger } = actionFlowManager.getTopTrigger();

  const withspace: boolean = commandObj
    ? commandObj.withspace ?? true
    : actionTrigger['withspace'] ?? true;

  const command: string | undefined = commandObj
    ? commandObj!.command
    : actionTrigger['command'];

  const querys: string[] = getScriptFilterQuery(inputStr, command, withspace);

  // If the ScriptFilters are nested, the first string element is query.
  // Otherwise, the first string element is command.

  const extensionVariables: Record<string, any> | undefined =
    resolveExtensionType() === 'plugin'
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

  actionFlowManager.updateTopTrigger({
    args: extractedArgs,
    scriptfilterProc: scriptWork,
  });

  return scriptWork
    .then((result) => {
      if (
        actionFlowManager.getTopTrigger().scriptfilterProc &&
        !actionFlowManager.getTopTrigger().scriptfilterProc!.isCanceled &&
        actionFlowManager.getTopTrigger().scriptfilterProc === scriptWork
      ) {
        printActionLog();
        scriptFilterCompleteEventHandler(result);
        if (actionFlowManager.getTopTrigger().scriptfilterRerun) {
          // Run recursive every scriptfilterRerun
          actionFlowManager.rerunTimer = setTimeout(() => {
            scriptFilterExcute(inputStr);
          }, actionFlowManager.getTopTrigger().scriptfilterRerun);
        }
      }
      return result;
    })
    .catch((err) => {
      // In case of cancel command by user
      if (_.isUndefined(actionFlowManager.getTopTrigger())) return;
      if (!scriptWork.isCanceled) {
        console.error(`Unexpected Error occurs:\n\n${err}`);
        actionFlowManager.handleScriptFilterError(err, { extractJson: false });
      }
    });
}
