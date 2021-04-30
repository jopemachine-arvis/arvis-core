import { handleAction } from "./actionHandler";
import { extractArgs, extractArgsFromScriptFilterItem } from "./argsHandler";
import { scriptFilterExcute } from '../actions/scriptFilter';
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
  workStk: Work[];
  globalVariables?: any;
  printDebuggingInfo?: boolean;
  handleAction: Function;

  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: ScriptFilterItem[]) => void;
  onWorkEndHandler?: () => void;

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
        scriptFilterExcute(this, inputStr);
      }
    } else {
      // clear command stack, and return to initial.
      this.clearCommandStack();
      this.onItemShouldBeUpdate && this.onItemShouldBeUpdate([]);
      this.onWorkEndHandler && this.onWorkEndHandler();
    }

    this.onItemPressHandler && this.onItemPressHandler();
  }
}
