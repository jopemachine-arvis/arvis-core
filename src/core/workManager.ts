import { handleAction } from "./actionHandler";
import { handleScriptFilterChange } from "./scriptFilterChangeHandler";
import { extractArgs, extractArgsFromScriptFilterItem } from "./argsHandler";

import "../types";

interface Work {
  type: string;
  input: string;
  bundleId: string;
  args: object | null;
  command: Command;

  // Used in only type is 'scriptfilter'
  workPromise?: Promise<any> | null;
  workCompleted?: boolean;
  rerunInterval?: number;
}

type WorkManagerProp = {
  printDebuggingInfo?: boolean;
};

export class WorkManager {
  private workStk: Work[];
  private globalVariables?: any;
  printDebuggingInfo?: boolean;
  handleAction: Function;

  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: ScriptFilterItem[]) => void;

  constructor(props: WorkManagerProp) {
    this.workStk = [];
    this.globalVariables = {};
    this.handleAction = handleAction.bind(this);
    this.printDebuggingInfo = props.printDebuggingInfo;
  }

  getTopCommand = () => {
    return this.workStk[this.workStk.length - 1];
  }

  clearCommandStack = () => {
    this.workStk.length = 0;
  }

  // If workStk is empty, look for command.
  hasEmptyWorkStk = () => {
    return this.workStk.length === 0;
  }

  workIsPending = () => {
    return (
      this.workStk.length >= 1 &&
      this.getTopCommand().workCompleted === false
    );
  }

  scriptFilterCompleteEventHandler = (result: any) => {
    const stdout = JSON.parse(result.stdout) as ScriptFilterResult;

    // Print to debugging window
    this.printDebuggingInfo &&
      console.log(`'${this.getTopCommand().bundleId}' prints.. : `, stdout);

    const { items, rerunInterval, variables } = stdout;

    this.globalVariables = { ...variables, ...this.globalVariables };
    this.workStk[this.workStk.length - 1].rerunInterval = rerunInterval;
    this.workStk[this.workStk.length - 1].workCompleted = true;

    // Append bundleId
    items.map((item: ScriptFilterItem) => {
      item.bundleId = this.getTopCommand().bundleId;
    });

    if (!this.onItemShouldBeUpdate) {
      console.error("onItemShouldBeUpdate is not set!!");
    }

    this.onItemShouldBeUpdate && this.onItemShouldBeUpdate(items);
  }

  // Handler for enter event
  async commandExcute(
    item: Command | ScriptFilterItem,
    inputStr: string,
    modifier: ModifierInput
  ) {
    // Ignore this exeution if previous work is pending.
    if (this.workIsPending()) {
      return;
    }

    // If the stack is empty, the args becomes query, otherwise args becomes arg of items
    let args: object;

    // If the stack is empty, the command becomes actions, otherwise the top action of the stack is 'actions'.
    let actions;

    if (this.hasEmptyWorkStk()) {
      item = item as Command;
      actions = [item];
      const [first, ...querys] = inputStr.split(" ");
      args = extractArgs(querys);

      // keyword, scriptfilter, or other starting node
      this.workStk.push({
        type: (item as Command).type,
        input: inputStr,
        command: item as Command,
        bundleId: (item as Command).bundleId!,
        args
      });

    } else {
      actions = this.getTopCommand().command.action;
      item = item as ScriptFilterItem;
      const vars = { ...item.variables, ...this.globalVariables! };
      args = extractArgsFromScriptFilterItem(item, vars);
    }

    const actionResult = this.handleAction({
      actions,
      queryArgs: args,
      modifiersInput: modifier,
    });

    if (actionResult.nextAction) {
      this.workStk.push({
        type: actionResult.nextAction.type,
        input: inputStr,
        command: actionResult.nextAction,
        bundleId: this.getTopCommand().bundleId,
        args: actionResult.args,
        workPromise: null,
        workCompleted: false,
      });

      // To do:: Other types could be added later.
      if (actionResult.nextAction.type === "scriptfilter") {
        this.scriptFilterExcute(inputStr);
      }
    } else {
      // clear command stack, and return to initial.
      this.clearCommandStack();
      this.onItemShouldBeUpdate && this.onItemShouldBeUpdate([]);
    }

    this.onItemPressHandler && this.onItemPressHandler();
  }

  async scriptFilterExcute(
    inputStr: string,
    // command object should be given when stack is empty
    commandWhenStackIsEmpty?: Command
  ): Promise<any> {
    // If Command stack is empty, you can enter the script filter without a return event.
    // To handle this, push this command to commandStk
    if (this.hasEmptyWorkStk()) {
      if (!commandWhenStackIsEmpty) {
        throw new Error("Error - command should be given when stack is empty");
      }
      this.workStk.push({
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

    const { bundleId, command, args } = this.getTopCommand();
    const [first, ...querys] = inputStr.split(" ");

    const extractedArgs = args ? args : extractArgs(querys);

    const scriptWork: Promise<any> = handleScriptFilterChange(
      bundleId,
      command,
      extractedArgs
    );

    this.workStk[this.workStk.length - 1].workPromise = scriptWork;

    return scriptWork
      .then((result) => {
        if (this.getTopCommand().workPromise === scriptWork) {
          this.scriptFilterCompleteEventHandler(result);
          if (this.getTopCommand().rerunInterval) {
            // Run recursive every rerunInterval
            setTimeout(() => {
              this.scriptFilterExcute(inputStr);
            }, this.getTopCommand().rerunInterval);
          }
        }
      })
      .catch((err) => {
        if (this.hasEmptyWorkStk()) {
          // When the command has been canceled.
          console.log("Command has been canceled.\n", err);
        } else {
          // Unexpected Error
          throw new Error(err);
        }
      });
  }
}
