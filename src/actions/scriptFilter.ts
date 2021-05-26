// tslint:disable: no-string-literal
import _ from 'lodash';
import { xml2json } from 'xml-js';
import execa, { ExecaError } from '../../execa';
import { log, LogType } from '../config';
import { getWorkflowList, WorkManager } from '../core';
import { extractArgsFromQuery } from '../core/argsHandler';
import { handleScriptFilterChange } from '../core/scriptFilterChangeHandler';

/**
 * @param  {any} variables
 * @summary Extract variables from xml format's ScriptFilterItem
 */
const xmlExtractGlobalVars = (variables: any) => {
  return _.reduce(
    variables.variable.map((variable) => {
      return {
        [variable._attributes.name]: variable._text,
      };
    }),
    (prev, curr) => {
      curr[Object.keys(prev)[0]] = Object.values(prev)[0];
      return curr;
    },
    {}
  );
};

/**
 * @param  {any} xmlScriptFilterItem
 * @summary Convert xml format's ScriptFilterItem to json format's ScriptFilterItem
 */
const xmlScriptFilterItemToJsonScriptFilterItem = (xmlScriptFilterItem: any) => {
  const extractValue = (obj: object | undefined, key: string) => {
    if (obj) return obj[key];
    return undefined;
  };

  const eachItem = {};
  // * Attributes
  eachItem['uid'] = extractValue(xmlScriptFilterItem._attributes, 'uid');
  eachItem['arg'] = extractValue(xmlScriptFilterItem._attributes, 'arg');
  eachItem['autocomplete'] = extractValue(xmlScriptFilterItem._attributes, 'autocomplete');
  eachItem["valid"] = extractValue(xmlScriptFilterItem._attributes, "valid");
  eachItem["type"] = extractValue(xmlScriptFilterItem._attributes, "type");

  // * Elements
  eachItem['title'] = extractValue(xmlScriptFilterItem.title, '_text');
  eachItem['subtitle'] = extractValue(xmlScriptFilterItem.subtitle, '_text');

  // To do :: Add below elements here
  eachItem['mod'] = {};
  eachItem['text'] = {
    copy: extractValue(xmlScriptFilterItem.text, '_text'),
    largetype: ''
  };
  eachItem['quicklookurl'] = extractValue(xmlScriptFilterItem.quicklookurl, '_text');
  eachItem['icon'] = {
    path: extractValue(xmlScriptFilterItem.icon, '_text')
  };

  return eachItem;
};

/**
 * @param  {string} stdout
 */
const parseStdout = (stdout: string): ScriptFilterResult => {
  try {
    if (stdout.startsWith('<?xml')) {
      let target = JSON.parse(
        xml2json(stdout, { compact: true, ignoreDeclaration: true })
      );

      if (target.output) target = target.output;

      const items = target.items.item
        ? target.items.item.length
          ? target.items.item.map(xmlScriptFilterItemToJsonScriptFilterItem)
          : [xmlScriptFilterItemToJsonScriptFilterItem(target.items.item)]
        : [];

      const variables = target.variables
        ? xmlExtractGlobalVars(target.variables)
        : {};

      const rerun = target.rerun ? target.rerun._text : undefined;

      return {
        items,
        variables,
        rerun,
      };
    } else {
      return JSON.parse(stdout) as ScriptFilterResult;
    }
  } catch (err) {
    throw new Error(`XML Script format error! ${err}\n\nstdout: ${stdout}`);
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
  const stdout = parseStdout(scriptFilterResult.stdout);

  workManager.printScriptfilter && log(LogType.info, '[SF Result]', stdout);

  const { items, rerun: rerunInterval, variables } = stdout;

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
 * @param  {ExecaError} err
 * @description Handler when scriptfilter's script fails
 */
function scriptErrorHandler (err: ExecaError) {
  const workManager = WorkManager.getInstance();

  if (err.timedOut) {
    log(LogType.error, `Script timeout!\n'${err}`);
  } else if (err.isCanceled) {
    // console.log('Command was canceled by other scriptfilter.');
  } else {
    if (workManager.hasEmptyWorkStk()) {
    // console.log('Command was canceled by user.');
    } else {
      log(LogType.error, `${err}`);
      workManager.handleWorkflowError(err);
    }
  }
}

/**
 * @param  {string} inputStr
 * @param  {string} command
 */
const getScriptFilterQuery = (inputStr: string, command: string): string[] => {
  const workManager = WorkManager.getInstance();

  if (workManager.hasNestedScriptFilters()) {
    return inputStr.split(' ');
  } else if (workManager.hasEmptyWorkStk()) {
    const arr = inputStr.split(command);
    return arr.slice(1, arr.length);
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

    workManager.setExecPath(commandWhenStackIsEmpty);
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

  const querys = getScriptFilterQuery(
    inputStr,
    commandWhenStackIsEmpty!.command!
  );

  // If the ScriptFilters are nested, the first string element is query.
  // Otherwise, the first string element is command.

  const extractedArgs = extractArgsFromQuery(querys);
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
        scriptFilterCompleteEventHandler(result);
        if (workManager.getTopWork().rerunInterval) {
          // Run recursive every rerunInterval
          workManager.rerunTimer = setTimeout(() => {
            scriptFilterExcute(inputStr);
          }, workManager.getTopWork().rerunInterval);
        }
      }
    })
    .catch(scriptErrorHandler);
}

export { scriptFilterExcute };
