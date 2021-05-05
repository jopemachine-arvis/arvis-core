import execa from 'execa';
import _ from 'lodash';
import { scriptFilterExcute } from '../actions/scriptFilter';
import '../types';
import extractJson from '../utils/extractJson';
import { handleAction } from './actionHandler';
import {
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
  getAppliedArgsFromScript,
} from './argsHandler';

interface Work {
  type: string;
  input: string;
  bundleId: string;
  args: object | null;
  command: Command;

  // Used in only type is 'scriptfilter'
  workCompleted?: boolean;
  workProcess?: execa.ExecaChildProcess | null;
  rerunInterval?: number;
}

type WorkManagerProp = {
  printActionType?: boolean;
  printWorkStack?: boolean;
  printWorkflowOutput?: boolean;
};

export class WorkManager {
  workStk: Work[];
  handleAction: Function;
  globalVariables?: object;
  rerunTimer?: NodeJS.Timeout;

  // For debugging
  printActionType?: boolean;
  printWorkStack?: boolean;
  printWorkflowOutput?: boolean;

  onWorkEndHandler?: () => void;
  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: ScriptFilterItem[]) => void;
  onInputShouldBeUpdate?: (str: string) => void;

  constructor(props: WorkManagerProp) {
    this.workStk = [];
    this.globalVariables = {};
    this.handleAction = handleAction.bind(this);

    this.printActionType = props.printActionType;
    this.printWorkStack = props.printWorkStack;
    this.printWorkflowOutput = props.printWorkflowOutput;
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

  pushWork = (work: Work) => {
    this.workStk.push(work);
    this.debugWorkStk();
  }

  setErrorItem = (err: any, errorItems: ScriptFilterItem[]) => {
    if (!this.onItemShouldBeUpdate) {
      console.error('onItemShouldBeUpdate is not set.');
      return;
    }

    if (errorItems.length !== 0) {
      this.onItemShouldBeUpdate(errorItems);
    } else {
      this.onItemShouldBeUpdate([
        {
          valid: false,
          title: err.name,
          subtitle: err.message,
          text: {
            copy: err.message,
            largetype: err.message,
          },
        },
      ]);
    }
  }

  handleWorkflowError = (err: any) => {
    const possibleJsons = extractJson(err.toString());
    const errors = possibleJsons.filter((item) => item.items);

    const errorItems = _.reduce(
      errors,
      (ret: any, errorObj: any) => {
        ret.push(errorObj.items[0]);
        return ret;
      },
      []
    );

    this.setErrorItem(err, errorItems);
  }

  setRunningText({
    itemArr,
    index,
    runningSubText,
  }: {
    itemArr: any[];
    index: number;
    runningSubText: string;
  }) {
    if (!this.onItemShouldBeUpdate) {
      console.error('onItemShouldBeUpdate is not set.');
      return;
    }

    const swap = itemArr;
    swap[index] = {
      ...itemArr[index],
      subtitle: runningSubText,
    };

    this.onItemShouldBeUpdate(swap);
  }

  hasNestedScriptFilters = () => {
    return (
      this.workStk.filter((work: Work) => work.type === 'scriptfilter')
        .length >= 2
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
      args = extractArgsFromQuery(querys);

      // keyword, scriptfilter, or other starting node
      this.pushWork({
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

  getNextActionsInput = (nextAction: Action, args) => {
    if (nextAction.type === 'scriptfilter') {
      return getAppliedArgsFromScript(nextAction.script_filter, args);
    }
    console.error(`Unsupported type, '${nextAction.type}'`);
    return 'Unsupported type error';
  }

  debugWorkStk = () => {
    if (!this.printWorkStack) return;

    console.log('---------- debug work stack ----------');
    for (const item of this.workStk) {
      console.log(item);
    }
    console.log('--------------------------------------');
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
          const newInput = this.getNextActionsInput(
            nextAction,
            actionResult.args
          );

          this.pushWork({
            type: nextAction.type,
            input: newInput,
            command: nextAction,
            bundleId: this.getTopWork().bundleId,
            args: actionResult.args,
            workProcess: null,
            workCompleted: false,
          });

          if (nextAction.type === 'scriptfilter') {
            scriptFilterExcute(this, newInput);

            this.onItemPressHandler && this.onItemPressHandler();
            this.onInputShouldBeUpdate &&
              this.onInputShouldBeUpdate(newInput + ' ');
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
