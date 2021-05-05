import execa from 'execa';
import { WorkManager } from '../core';
import { extractArgsFromQuery } from '../core/argsHandler';
import { handleScriptFilterChange } from '../core/scriptFilterChangeHandler';

function scriptFilterCompleteEventHandler(
  workManager: WorkManager,
  result: execa.ExecaReturnValue<string>
) {
  const stdout = JSON.parse(result.stdout) as ScriptFilterResult;

  workManager.printWorkflowOutput &&
    console.log(`'${workManager.getTopWork().bundleId}' prints.. : \n`, stdout);

  const { items, rerun: rerunInterval, variables } = stdout;

  workManager.globalVariables = {
    ...variables,
    ...workManager.globalVariables,
  };

  workManager.workStk[
    workManager.workStk.length - 1
  ].rerunInterval = rerunInterval;

  workManager.workStk[workManager.workStk.length - 1].workCompleted = true;

  // Append bundleId to each ScriptFilterItem.
  items.map((item: ScriptFilterItem) => {
    item.bundleId = workManager.getTopWork().bundleId;
  });

  if (!workManager.onItemShouldBeUpdate) {
    console.error('onItemShouldBeUpdate is not set!!');
  }

  workManager.onItemShouldBeUpdate && workManager.onItemShouldBeUpdate(items);
}

async function scriptFilterExcute(
  workManager: WorkManager,
  inputStr: string,
  // command object should be given when stack is empty
  commandWhenStackIsEmpty?: Command
): Promise<void> {
  // If WorkStk is empty, users can enter the script filter without a return event.
  // To handle this, push this command to WorkStk
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

  workManager.workStk[workManager.workStk.length - 1].workProcess = scriptWork;

  scriptWork
    .then((result) => {
      if (workManager.getTopWork().workProcess === scriptWork) {
        scriptFilterCompleteEventHandler(workManager, result);
        if (workManager.getTopWork().rerunInterval) {
          // Run recursive every rerunInterval
          workManager.rerunTimer = setTimeout(() => {
            scriptFilterExcute(workManager, inputStr);
          }, workManager.getTopWork().rerunInterval);
        }
      }
    })
    .catch((err) => {
      if (
        err.message.includes('Command was canceled') ||
        workManager.hasEmptyWorkStk()
      ) {
        console.log('Command was canceled.');
      } else {
        console.error(`Workflow Error\n${err}`);
        workManager.handleWorkflowError(err);
      }
    });
}

export { scriptFilterExcute };
