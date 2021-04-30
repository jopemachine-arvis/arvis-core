import { extractArgs } from "../core/argsHandler";
import { WorkManager } from "../core";
import { handleScriptFilterChange } from "../core/scriptFilterChangeHandler";

function scriptFilterCompleteEventHandler(
  workManager: WorkManager,
  result: any
) {
  const stdout = JSON.parse(result.stdout) as ScriptFilterResult;

  // Print to debugging window
  workManager.printDebuggingInfo &&
    console.log(
      `'${workManager.getTopCommand().bundleId}' prints.. : \n`,
      stdout
    );

  const { items, rerun: rerunInterval, variables } = stdout;

  workManager.globalVariables = {
    ...variables,
    ...workManager.globalVariables,
  };
  workManager.workStk[
    workManager.workStk.length - 1
  ].rerunInterval = rerunInterval;
  workManager.workStk[workManager.workStk.length - 1].workCompleted = true;

  // Append bundleId
  items.map((item: ScriptFilterItem) => {
    item.bundleId = workManager.getTopCommand().bundleId;
  });

  if (!workManager.onItemShouldBeUpdate) {
    console.error("onItemShouldBeUpdate is not set!!");
  }

  workManager.onItemShouldBeUpdate && workManager.onItemShouldBeUpdate(items);
}

async function scriptFilterExcute(
  workManager: WorkManager,
  inputStr: string,
  // command object should be given when stack is empty
  commandWhenStackIsEmpty?: Command
): Promise<any> {
  // If Command stack is empty, you can enter the script filter without a return event.
  // To handle this, push this command to commandStk
  if (workManager.hasEmptyWorkStk()) {
    if (!commandWhenStackIsEmpty) {
      throw new Error("Error - command should be given when stack is empty");
    }
    workManager.workStk.push({
      type: "scriptfilter",
      // user input string
      input: inputStr,
      command: commandWhenStackIsEmpty,
      bundleId: commandWhenStackIsEmpty.bundleId!,
      args: null,
      workPromise: null,
      workCompleted: false,
    });
  }

  const { bundleId, command, args } = workManager.getTopCommand();
  const [first, ...querys] = inputStr.split(" ");

  const extractedArgs = args ? args : extractArgs(querys);

  const scriptWork: Promise<any> = handleScriptFilterChange(
    bundleId,
    command,
    extractedArgs
  );

  workManager.workStk[workManager.workStk.length - 1].workPromise = scriptWork;

  return scriptWork
    .then((result) => {
      if (workManager.getTopCommand().workPromise === scriptWork) {
        scriptFilterCompleteEventHandler(workManager, result);
        if (workManager.getTopCommand().rerunInterval) {
          // Run recursive every rerunInterval
          setTimeout(() => {
            scriptFilterExcute(workManager, inputStr);
          }, workManager.getTopCommand().rerunInterval);
        }
      }
    })
    .catch((err) => {
      if (workManager.hasEmptyWorkStk()) {
        // When the command has been canceled.
        console.log("Command has been canceled.\n", err);
      } else {
        // Unexpected Error
        throw new Error(err);
      }
    });
}

export { scriptFilterExcute };
