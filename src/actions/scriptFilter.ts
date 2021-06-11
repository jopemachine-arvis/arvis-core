// tslint:disable: no-string-literal
import chalk from 'chalk';
import _ from 'lodash';
import parseJson from 'parse-json';
import execa from '../../execa';
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
const printActionLog = () => {
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
      console.error('Warning: XML scriptfilter format not supported yet!');

      const { items, variables, rerun } = xmlToJsonScriptFilterItemFormat(
        stdout,
        stderr
      );
      return {
        items,
        variables,
        rerun,
      };
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
) {
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
  // To do :: If this code could be used in plugin, below codes need to be fixed.
  const workflowDefaultIcon = getWorkflowList()[bundleId].defaultIcon;

  items.map((item: ScriptFilterItem) => {
    // Append bundleId to each ScriptFilterItem.
    item.bundleId = bundleId;
    // Append workflow's defaultIcon
    item.icon = item.icon ?? {
      path: workflowDefaultIcon,
    };
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
  err: Error,
  options?: { extractJson?: boolean } | undefined
) {
  const workManager = WorkManager.getInstance();

  if (err['timedOut']) {
    log(LogType.error, `Script timeout!\n'${err}`);
  } else if (err['isCanceled']) {
    // console.log('Command was canceled by other scriptfilter.');
  } else {
    if (workManager.hasEmptyWorkStk()) {
      // console.log('Command was canceled by user.');
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

  const getQuery = () => {
    // assert(command);
    const targetCommand = withspace ? command! + ' ' : command!;
    const arr = inputStr.split(targetCommand);
    return arr.slice(1, arr.length).join(targetCommand).split(' ');
  };

  if (workManager.hasNestedScriptFilters()) {
    return inputStr.split(' ');
  } else if (workManager.hasEmptyWorkStk()) {
    return getQuery();
  } else if (workManager.getTopWork().type === 'scriptfilter') {
    return getQuery();
  }

  return [];
};

/**
 * @param  {string} inputStr
 * @param  {Command} commandWhenStackIsEmpty? command object should be given when stack is empty
 */
async function scriptFilterExcute(
  inputStr: string,
  commandWhenStackIsEmpty?: Command
): Promise<void> {
  // If WorkStk is empty, users can enter the script filter without a return event.
  // To handle this, push this command to WorkStk
  const workManager = WorkManager.getInstance();

  if (workManager.hasEmptyWorkStk()) {
    if (!commandWhenStackIsEmpty) {
      throw new Error('Error - command should be given when stack is empty');
    }
    workManager.pushWork({
      type: 'scriptfilter',
      // user input string
      input: inputStr,
      action: commandWhenStackIsEmpty.action,
      actionTrigger: commandWhenStackIsEmpty,
      bundleId: commandWhenStackIsEmpty.bundleId!,
      args: null,
      workProcess: null,
      workCompleted: false,
    });

    pushInputStrLog(commandWhenStackIsEmpty.command!);
    workManager.setExtensionInfo(commandWhenStackIsEmpty);
  } else {
    const newScriptFilterNeedsToExecuted =
      workManager.getTopWork().type === 'scriptfilter' &&
      workManager.getTopWork().workProcess &&
      !workManager.getTopWork().workCompleted;

    if (newScriptFilterNeedsToExecuted) {
      workManager.getTopWork().workProcess!.cancel();
    }
  }

  if (workManager.rerunTimer) {
    clearInterval(workManager.rerunTimer);
  }

  const { bundleId, actionTrigger, args } = workManager.getTopWork();

  const withspace = commandWhenStackIsEmpty
    ? commandWhenStackIsEmpty.withspace ?? true
    : workManager.getTopWork().actionTrigger['withspace'];

  // 중첩된 스크립트 필터의 경우 command가 필요 없을 것임.
  // 만약 필요하다면 firstTrigger를 따로 저장해놔야 할 수 있음
  const command = commandWhenStackIsEmpty
    ? commandWhenStackIsEmpty!.command
    : (workManager.getTopWork().actionTrigger as Command).command;

  const querys = getScriptFilterQuery(inputStr, command, withspace);

  // If the ScriptFilters are nested, the first string element is query.
  // Otherwise, the first string element is command.

  const extensionVariables =
    workManager.extensionInfo!.type === 'plugin'
      ? getPluginList()[bundleId].variables
      : getWorkflowList()[bundleId].variables ?? {};

  const extractedArgs = applyExtensionVars(
    extractArgsFromQuery(querys),
    extensionVariables
  );

  if (workManager.printArgs) {
    // Print 'args' to debugging console
    log(LogType.info, '[Args]', extractedArgs);
  }

  const scriptWork: execa.ExecaChildProcess = handleScriptFilterChange(
    bundleId,
    // Assume
    actionTrigger as Command | Action | PluginItem,
    extractedArgs
  );

  workManager.updateTopWork({
    workProcess: scriptWork,
  });

  scriptWork
    .then((result) => {
      if (workManager.getTopWork().workProcess === scriptWork) {
        printActionLog();
        scriptFilterCompleteEventHandler(result);
        if (workManager.getTopWork().rerunInterval) {
          // Run recursive every rerunInterval
          workManager.rerunTimer = setTimeout(() => {
            scriptFilterExcute(inputStr);
          }, workManager.getTopWork().rerunInterval);
        }
      }
    })
    .catch((err) =>
      scriptErrorHandler(err, { extractJson: err['extractJson'] ?? true })
    );
}

export { scriptFilterExcute };
