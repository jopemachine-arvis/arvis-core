import { xml2json } from 'xml-js';
import execa, { ExecaError } from '../../execa';
import { getWorkflowList, WorkManager } from '../core';
import { extractArgsFromQuery } from '../core/argsHandler';
import { handleScriptFilterChange } from '../core/scriptFilterChangeHandler';

/**
 * @param  {string} stdout
 */
const parseStdout = (stdout: string): ScriptFilterResult => {
  try {
    if (stdout.startsWith('<?xml')) {
      const target = JSON.parse(
        xml2json(stdout, { compact: true, ignoreDeclaration: true })
      );
      const getValue = (obj: object | undefined, key: string) => {
        if (obj) return obj[key];
        return undefined;
      };

      const items = target.items.item ? target.items.item.map(item => {
        const eachItem = {};
        eachItem['title'] = getValue(item.title, '_text');
        eachItem['subtitle'] = getValue(item.title, '_text');
        eachItem['uid'] = getValue(item._attributes, 'uid');
        eachItem['arg'] = getValue(item._attributes, 'arg');
        eachItem['autocomplete'] = getValue(item._attributes, 'autocomplete');
        eachItem['icon'] = {
          path: getValue(item.icon, '_text')
        };

        return eachItem;
      }) : [];

      return {
        items,
        variables: {},
        rerun: undefined,
      };
    } else {
      return JSON.parse(stdout) as ScriptFilterResult;
    }
  } catch (err) {
    throw new Error(`Script format error! ${err}`);
  }
};

/**
 * @param  {execa.ExecaReturnValue<string>} result
 */
function scriptFilterCompleteEventHandler(
  scriptFilterResult: execa.ExecaReturnValue<string>
) {
  const workManager = WorkManager.getInstance();
  const stdout = parseStdout(scriptFilterResult.stdout);

  workManager.printScriptfilter && console.log('[SF Result]', stdout);

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
    throw new Error('renderer update funtions are not set!');
  }

  workManager.onItemShouldBeUpdate({ items, needIndexInfoClear: true });
}

/**
 * @param  {ExecaError} err
 */
function scriptErrorHandler (err: ExecaError) {
  const workManager = WorkManager.getInstance();

  if (err.timedOut) {
    console.error(`Script timeout!\n'${err}`);
  } else if (err.isCanceled) {
    // console.log('Command was canceled by other scriptfilter.');
  } else {
    if (workManager.hasEmptyWorkStk()) {
    // console.log('Command was canceled by user.');
    } else {
      console.error(`${err}`);
      workManager.handleWorkflowError(err);
    }
  }
}

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
  const haveNoCommandInfo = workManager.hasEmptyWorkStk();

  if (haveNoCommandInfo) {
    if (!commandWhenStackIsEmpty) {
      throw new Error('Error - command should be given when stack is empty');
    }
    workManager.pushWork({
      type: 'scriptfilter',
      // user input string
      input: inputStr,
      command: commandWhenStackIsEmpty,
      bundleId: commandWhenStackIsEmpty.bundleId!,
      args: null,
      workProcess: null,
      workCompleted: false,
    });
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

  const { bundleId, command, args } = workManager.getTopWork();

  const inputStrArr = inputStr.split(' ');

  // If the ScriptFilters are nested, the first string element is query.
  // Otherwise, the first string element is command.
  const querys = workManager.hasNestedScriptFilters()
    ? inputStrArr
    : inputStrArr.slice(1, inputStrArr.length);

  const extractedArgs = extractArgsFromQuery(querys);
  const scriptWork: execa.ExecaChildProcess = handleScriptFilterChange(
    bundleId,
    command,
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
