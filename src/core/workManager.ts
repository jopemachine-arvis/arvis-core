import execa from 'execa';
import _ from 'lodash';
import { scriptFilterExcute } from '../actions/scriptFilter';
import '../types';
import extractJson from '../utils/extractJson';
import { handleAction } from './actionHandler';
import { extractArgs, extractArgsFromScriptFilterItem } from './argsHandler';

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
            largetype: err.message
          }
        }
      ]);
    }
  }

  handleWorkflowError = (err: any) => {
    const possibleJsons = extractJson(err.toString());
    const errors = possibleJsons.filter(item => item.items);

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

  applyArgs = (scriptStr: string, args: any) => {
    const strArr: string[] = scriptStr.split(' ');
    const argsArr: string[] = new Array(strArr.length);
    argsArr.fill('');

    for (const arg of Object.keys(args)) {
      // 따옴표 때문에 아래 같은 케이스에서 안 잡히는 경우가 많다. 따옴표 처리 어떻게 할 것인지 명확히 정할 것.
      // args에 작은 따옴표로 감싸진 경우, 큰 따옴표로 감싸진 경우 다 넣어버릴까?
      if (strArr.includes(`'${arg}'`)) {
        const order = strArr.indexOf(`'${arg}'`);
        argsArr[order] = args[arg];
      }
    }

    return _.reduce(argsArr, (ret, inputArg, idx) => {
      if (inputArg === '') return '';
      return inputArg;
    }, '');
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
          this.pushWork({
            type: nextAction.type,
            input: inputStr,
            command: nextAction,
            bundleId: this.getTopWork().bundleId,
            args: actionResult.args,
            workProcess: null,
            workCompleted: false,
          });

          if (nextAction.type === 'scriptfilter') {
            const newInput = this.applyArgs(
              nextAction.script_filter,
              actionResult.args
            );

            scriptFilterExcute(this, inputStr + ' ' + newInput);

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
