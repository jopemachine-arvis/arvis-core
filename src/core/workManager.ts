import { scriptFilterExcute } from '../actions/scriptFilter';
import '../types';
import { handleAction } from './actionHandler';
import { extractArgs, extractArgsFromScriptFilterItem } from './argsHandler';

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

  getTopWork = () => {
    return this.workStk[this.workStk.length - 1];
  }

  clearWorkStack = () => {
    this.workStk.length = 0;
  }

  // If workStk is empty, look for command.
  hasEmptyWorkStk = () => {
    return this.workStk.length === 0;
  }

  workIsPending = () => {
    return (
      this.workStk.length >= 1 && this.getTopWork().workCompleted === false
    );
  }

  prepareActions = ({
    item,
    inputStr,
  }: {
    item: Command | ScriptFilterItem;
    inputStr: string;
  }) => {
    let actions;
    let args;

    if (this.hasEmptyWorkStk()) {
      item = item as Command;
      actions = [item];
      const [first, ...querys] = inputStr.split(' ');
      args = extractArgs(querys);

      // keyword, scriptfilter, or other starting node
      this.workStk.push({
        type: (item as Command).type,
        input: inputStr,
        command: item as Command,
        bundleId: (item as Command).bundleId!,
        args,
      });
    } else {
      actions = this.getTopWork().command.action;
      item = item as ScriptFilterItem;
      const vars = { ...item.variables, ...this.globalVariables! };
      args = extractArgsFromScriptFilterItem(item, vars);
    }

    return {
      args,
      actions,
    };
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

    // If workStk is empty, the args becomes query, otherwise args becomes arg of items
    // If workStk is empty, the actions becomes command, otherwise the top action of the stack is 'actions'.
    const { args, actions } = this.prepareActions({ item, inputStr });

    let actionResult;
    let targetActions = actions;

    while (targetActions && targetActions.length > 0) {
      actionResult = this.handleAction({
        actions: targetActions,
        queryArgs: args,
        modifiersInput: modifier,
      });

      targetActions = actionResult.nextActions;

      if (targetActions && targetActions.length > 0) {
        for (const nextAction of targetActions) {
          this.workStk.push({
            type: nextAction.type,
            input: inputStr,
            command: nextAction,
            bundleId: this.getTopWork().bundleId,
            args: actionResult.args,
            workPromise: null,
            workCompleted: false,
          });

          if (nextAction.type === 'scriptfilter') {
            scriptFilterExcute(this, inputStr);
            this.onItemPressHandler && this.onItemPressHandler();
            return;
          }
        }
      }
    }

    this.clearWorkStack();
    this.onItemShouldBeUpdate && this.onItemShouldBeUpdate([]);
    this.onItemPressHandler && this.onItemPressHandler();
    this.onWorkEndHandler && this.onWorkEndHandler();
  }
}
