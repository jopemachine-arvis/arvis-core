// tslint:disable: no-string-literal
import chalk from 'chalk';
import execa, { ExecaReturnValue } from 'execa';
import _ from 'lodash';
import PCancelable from 'p-cancelable';
import parseJson from 'parse-json';
import { log, LogType, pushInputStrLog } from '../config';
import {
  ActionFlowManager,
  getPluginList,
  getWorkflowList,
  Renderer,
  resolveExtensionType,
  xmlToJsonScriptFilterItemFormat,
} from '../core';
import { applyExtensionVars, extractArgsFromQuery } from '../core/argsHandler';
import { handleScriptFilterChange } from '../core/scriptFilterChangeHandler';
import { exitify } from '../utils';

/**
 * @summary
 */
const printActionLog = (): void => {
  const actionFlowManager = ActionFlowManager.getInstance();
  if (actionFlowManager.printActionType) {
    log(
      LogType.info,
      chalk.redBright(`[Action: scriptfilter] `),
      actionFlowManager.getTopTrigger().actionTrigger
    );
  }
};

/**
 * @param stdout
 * @param stderr
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
 * Event Handler when scriptfilter's script is complete
 * @param result
 */
const scriptFilterCompleteEventHandler = (
  scriptFilterResult: execa.ExecaReturnValue<string>
): void => {
  const actionFlowManager = ActionFlowManager.getInstance();

  const stdio = parseStdio(
    scriptFilterResult.stdout,
    scriptFilterResult.stderr
  );

  actionFlowManager.printScriptfilter && log(LogType.info, '[Scriptfilter Result]', stdio);

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

  Renderer.onItemShouldBeUpdate({ items, needIndexInfoClear: true });
};

/**
 * @param inputStr
 * @param command
 * @param withspace
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
 * @param inputStr
 * @param commandObj? command object should be given when stack is empty
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

  const { exit, value } = await exitify(extractArgsFromQuery)(querys);
  if (exit) return;

  const extractedArgs: Record<string, any> = applyExtensionVars(
    value,
    extensionVariables
  );

  actionFlowManager.printVariableInfo(extractedArgs);

  const scriptWork: PCancelable<execa.ExecaReturnValue<string>> = handleScriptFilterChange(
    bundleId,
    // Assum
    actionTrigger as Command | Action | PluginItem,
    extractedArgs,
  );

  actionFlowManager.updateTopTrigger({
    args: extractedArgs,
    scriptfilterProc: scriptWork,
  });

  return scriptWork
    .then((result: ExecaReturnValue<string>) => {
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
      if (!scriptWork.isCanceled && !err.isCanceled) {
        console.error(`Unexpected Error occurs:\n\n${err}`);
        actionFlowManager.handleScriptFilterError(err, { extractJson: false });
      }
    });
}
