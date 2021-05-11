import _ from 'lodash';
import execa from '../../execa';
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
  items?: ScriptFilterItem[];
}

export class WorkManager {
  private static instance: WorkManager;

  static getInstance() {
    if (!WorkManager.instance) {
      WorkManager.instance = new WorkManager();
    }
    return WorkManager.instance;
  }

  workStk: Work[];
  handleAction: Function;
  globalVariables?: object;
  rerunTimer?: NodeJS.Timeout;

  // For debugging
  printActionType?: boolean;
  printWorkStack?: boolean;
  printWorkflowOutput?: boolean;
  printArgs?: boolean;
  printScriptfilter?: boolean;

  onWorkEndHandler?: () => void;
  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: ScriptFilterItem[]) => void;
  onInputShouldBeUpdate?: ({
    str,
    needItemsUpdate,
  }: {
    str: string;
    needItemsUpdate: boolean;
  }) => void;

  private constructor() {
    this.workStk = [];
    this.globalVariables = {};
    this.handleAction = handleAction.bind(this);
  }

  /**
   * @summary
   */
  getTopWork = () => {
    return this.workStk[this.workStk.length - 1];
  }

  /**
   * @summary
   */
  clearWorkStack = () => {
    this.workStk.length = 0;
  }

  /**
   * @summary
   */
  updateTopWork = (keyValueDict: object) => {
    for (const key of Object.keys(keyValueDict)) {
      this.workStk[this.workStk.length - 1][key] = keyValueDict[key];
    }
  }

  /**
   * @summary If workStk is empty, look for command.
   */
  hasEmptyWorkStk = () => {
    return this.workStk.length === 0;
  }

  /**
   * @summary
   */
  workIsPending = () => {
    return (
      this.workStk.length >= 1 && this.getTopWork().workCompleted === false
    );
  }

  /**
   * @param {Work} work
   */
  pushWork = (work: Work) => {
    this.workStk.push(work);
    this.debugWorkStk();
  }

  /**
   * @summary If the script filters are nested, return to the previous script filter.
   */
  popWork = () => {
    if (
      !this.onItemShouldBeUpdate ||
      !this.onInputShouldBeUpdate ||
      !this.onWorkEndHandler
    ) {
      throw new Error('renderer update funtions are not set!');
    }

    if (this.hasNestedScriptFilters()) {
      this.workStk.pop();
      if (this.getTopWork().type !== 'scriptfilter') return;

      this.onItemShouldBeUpdate(this.getTopWork().items!);
      this.onInputShouldBeUpdate({
        str: this.getTopWork().input,
        needItemsUpdate: false,
      });

      this.debugWorkStk();
    } else {
      this.clearWorkStack();
      this.onItemShouldBeUpdate([]);
      this.onWorkEndHandler();
      return;
    }
  }

  /**
   * @param  {any} err
   * @param  {ScriptFilterItem[]} errorItems
   * @summary When an error occurs, onItemShouldBeUpdate is called by this method and those error messages are displayed to the user.
   */
  setErrorItem = (err: any, errorItems: ScriptFilterItem[]) => {
    if (!this.onItemShouldBeUpdate) {
      throw new Error('renderer update funtions are not set!');
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

  /**
   * @param  {any} err
   */
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

  /**
   * @param  {any[]} itemArr
   * @param  {number} index
   * @param  {string} runningSubText
   */
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
      throw new Error('renderer update funtions are not set!');
    }

    const swap = itemArr;
    swap[index] = {
      ...itemArr[index],
      subtitle: runningSubText,
    };

    this.onItemShouldBeUpdate(swap);
  }

  /**
   * @summary
   */
  hasNestedScriptFilters = () => {
    return (
      this.workStk.filter((work: Work) => work.type === 'scriptfilter')
        .length >= 2
    );
  }

  /**
   * @param  {Command | ScriptFilterItem} item
   * @param  {string} inputStr
   */
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

      const [_commandTitle, queryStr] = inputStr.split(item.title);
      args = extractArgsFromQuery(queryStr ? queryStr.trim().split(' ') : []);

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

  /**
   * @param  {Action} nextAction
   * @param  {any} args
   */
  getNextActionsInput = (nextAction: Action, args) => {
    if (nextAction.type === 'scriptfilter') {
      return getAppliedArgsFromScript(nextAction.script_filter, args);
    }
    console.error(`Unsupported type, '${nextAction.type}'`);
    return 'Unsupported type error';
  }

  /**
   * @summary
   */
  debugWorkStk = () => {
    if (!this.printWorkStack) return;

    console.log('---------- debug work stack ----------');
    for (const item of this.workStk) {
      console.log(item);
    }
    console.log('--------------------------------------');
  }

  /**
   * @param  {string} str
   * @summary Update input of stack (It could be used when popWork)
   */
  renewInput = (str: string) => {
    if (this.getTopWork().type === 'scriptfilter') {
      this.workStk[this.workStk.length - 1].input = str;
    }
  }

  /**
   * @param  {Command|ScriptFilterItem} item
   * @param  {string} inputStr
   * @param  {ModifierInput} modifier
   * @summary Handler for enter event
   */
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
    const exists = (arr: any[]) => arr && arr.length > 0;

    // Renew input
    this.renewInput(inputStr);

    while (exists(targetActions)) {
      actionResult = this.handleAction({
        actions: targetActions,
        queryArgs: args,
        modifiersInput: modifier,
      });

      targetActions = actionResult.nextActions;

      if (exists(targetActions)) {
        for (const nextAction of targetActions) {
          const nextInput = this.getNextActionsInput(
            nextAction,
            actionResult.args
          );

          // 왜 여기에 keyword를 뒀더라..? 생각이 안 남...
          if (
            nextAction.type === 'scriptfilter' ||
            nextAction.type === 'keyword'
          ) {
            this.pushWork({
              type: nextAction.type,
              input: nextInput,
              command: nextAction,
              bundleId: this.getTopWork().bundleId,
              args: actionResult.args,
              workProcess: null,
              workCompleted: false,
            });
          }

          if (nextAction.type === 'scriptfilter') {
            scriptFilterExcute(nextInput);

            this.onItemPressHandler && this.onItemPressHandler();
            this.onInputShouldBeUpdate &&
              this.onInputShouldBeUpdate({
                str: nextInput + ' ',
                needItemsUpdate: false,
              });
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
