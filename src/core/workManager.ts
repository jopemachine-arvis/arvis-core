// tslint:disable: no-string-literal

import _ from 'lodash';
import execa from '../../execa';
import { handleKeywordWaiting, setKeywordItem } from '../actions';
import { scriptFilterExcute } from '../actions/scriptFilter';
import { log, LogType } from '../config';
import {
  getPluginInstalledPath,
  getWorkflowInstalledPath,
} from '../config/path';
import '../types';
import extractJson from '../utils/extractJson';
import { handleAction } from './actionHandler';
import {
  extractArgsFromPluginItem,
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
  getAppliedArgsFromScript,
} from './argsHandler';
import { extractScriptOnThisPlatform } from './scriptExtracter';

interface Work {
  /**
   * @description Work's type
   *              Possible value is `keyword`, `keyword-waiting`, `scriptfilter`, `hotkey`
   */
  type: string;

  /**
   * @description
   */
  input: string;

  /**
   * @description Workflow or plugin's bundleId
   */
  bundleId: string;

  /**
   * @description Applied args
   */
  args: object | null;

  /**
   * @description nextAction to execute
   */
  action: Action[] | undefined;

  /**
   * @description trigger that triggers action.
   *              starts with command object or pluginItem and becomes scriptFilterItem or action
   */
  actionTrigger?: Command | PluginItem | ScriptFilterItem | Action;

  /**
   * @description Used in only type is 'scriptfilter'
   *              Indicates whether scriptfilter script is running
   */
  workCompleted?: boolean;

  /**
   * @description Used in only type is 'scriptfilter'
   *              ExecaChildProcess object (promise)
   */
  workProcess?: execa.ExecaChildProcess | null;

  /**
   * @description Scriptfilter's rerun interval
   */
  rerunInterval?: number;

  /**
   * @description Scriptfilter's script execution result
   */
  items?: ScriptFilterItem[];
}

/**
 * @description Manage the execution of tasks (works)
 *              In the CUI, GUI, create a singleton object of this class to execute action, scriptfilter
 */
export class WorkManager {
  private static instance: WorkManager;

  static getInstance() {
    if (!WorkManager.instance) {
      WorkManager.instance = new WorkManager();
    }
    return WorkManager.instance;
  }

  workStk: Work[];
  globalVariables?: object;
  rerunTimer?: NodeJS.Timeout;
  execPath?: string;

  // For debugging, set below variables
  public printActionType?: boolean;
  public printWorkStack?: boolean;
  public printWorkflowOutput?: boolean;
  public printArgs?: boolean;
  public printScriptfilter?: boolean;

  public maxRetrieveCount?: number;

  public onWorkEndHandler?: () => void;
  public onItemPressHandler?: () => void;

  public onItemShouldBeUpdate?: ({
    items,
    needIndexInfoClear,
  }: {
    items: ScriptFilterItem[];
    needIndexInfoClear: boolean;
  }) => void;

  public onInputShouldBeUpdate?: ({
    str,
    needItemsUpdate,
  }: {
    str: string;
    needItemsUpdate: boolean;
  }) => void;

  private constructor() {
    this.workStk = [];
    this.globalVariables = {};
  }

  /**
   * @summary
   */
  public getTopWork = () => {
    return this.workStk[this.workStk.length - 1];
  }

  /**
   * @summary
   */
  public clearWorkStack = () => {
    this.workStk.length = 0;
    this.globalVariables = {};
    this.rerunTimer = undefined;
    this.execPath = undefined;
  }

  /**
   * @summary
   */
  public updateTopWork = (keyValueDict: object) => {
    for (const key of Object.keys(keyValueDict)) {
      this.workStk[this.workStk.length - 1][key] = keyValueDict[key];
    }
  }

  /**
   * @summary If workStk is empty, look for command.
   */
  public hasEmptyWorkStk = () => {
    return this.workStk.length === 0;
  }

  /**
   * @summary
   */
  public workIsPending = () => {
    return (
      this.workStk.length >= 1 && this.getTopWork().workCompleted === false
    );
  }

  /**
   * @param {Work} work
   */
  public pushWork = (work: Work) => {
    this.workStk.push(work);
    this.debugWorkStk();
  }

  /**
   * @summary If the script filters are nested, return to the previous script filter.
   */
  public popWork = () => {
    if (
      !this.onItemShouldBeUpdate ||
      !this.onInputShouldBeUpdate ||
      !this.onWorkEndHandler
    ) {
      throw new Error('Renderer update funtions are not set!');
    }

    // To do:: Handle keyword, keyword-waiting here..
    if (this.hasNestedScriptFilters()) {
      this.workStk.pop();
      if (this.getTopWork().type !== 'scriptfilter') return;

      this.onItemShouldBeUpdate({
        items: this.getTopWork().items!,
        needIndexInfoClear: true,
      });
      this.onInputShouldBeUpdate({
        str: this.getTopWork().input,
        needItemsUpdate: false,
      });

      this.debugWorkStk();
    } else {
      this.clearWorkStack();
      this.onItemShouldBeUpdate({ items: [], needIndexInfoClear: true });
      this.onWorkEndHandler();
      return;
    }
  }

  /**
   * @param  {any} err
   * @param  {ScriptFilterItem[]} errorItems
   * @summary When an error occurs, onItemShouldBeUpdate is called by this method
   *          And those error messages are displayed to the user in the form of items.
   */
  public setErrorItem = (err: any, errorItems: ScriptFilterItem[]) => {
    if (!this.onItemShouldBeUpdate) {
      throw new Error('Renderer update funtions are not set!');
    }

    if (errorItems.length !== 0) {
      this.onItemShouldBeUpdate({
        items: errorItems,
        needIndexInfoClear: true,
      });
    } else {
      this.onItemShouldBeUpdate({
        items: [
          {
            valid: false,
            title: err.name,
            subtitle: err.message,
            text: {
              copy: err.message,
              largetype: err.message,
            },
          },
        ],
        needIndexInfoClear: true,
      });
    }
  }

  /**
   * @param  {number} selectedItemIdx
   * @param  {ModifierInput} modifiers
   */
  public setModifierOnScriptFilterItem = (
    selectedItemIdx: number,
    modifiers: ModifierInput
  ) => {
    if (!this.onItemShouldBeUpdate) {
      throw new Error('Renderer update funtions are not set!');
    }
    if (
      this.hasEmptyWorkStk() ||
      this.getTopWork().type !== 'scriptfilter' ||
      !this.getTopWork().workCompleted
    ) {
      return;
    }

    const pressedModifier: string = _.filter(
      Object.keys(modifiers),
      (modifier: string) => {
        return modifiers[modifier] === true ? true : false;
      }
    )[0];

    const items = _.map(this.getTopWork().items, _.cloneDeep);

    if (!pressedModifier || !items || !items.length) {
      return;
    }

    if (
      items[selectedItemIdx].mods &&
      items[selectedItemIdx].mods![pressedModifier]
    ) {
      const targetMods = items[selectedItemIdx].mods![pressedModifier];
      const modifiersAttributes = Object.keys(targetMods);
      for (const modifierAttribute of modifiersAttributes) {
        items[selectedItemIdx][modifierAttribute] =
          targetMods[modifierAttribute];
      }
    } else {
      items[selectedItemIdx] = {
        ...items[selectedItemIdx],
        subtitle: '',
      };
    }

    this.onItemShouldBeUpdate({ items, needIndexInfoClear: false });
  }

  /**
   * @summary
   */
  public clearModifierOnScriptFilterItem = () => {
    if (!this.onItemShouldBeUpdate) {
      throw new Error('Renderer update funtions are not set!');
    }
    if (
      this.hasEmptyWorkStk() ||
      this.getTopWork().type !== 'scriptfilter' ||
      !this.getTopWork().workCompleted
    ) {
      return;
    }

    this.onItemShouldBeUpdate({
      items: this.getTopWork().items!,
      needIndexInfoClear: false,
    });
  }

  /**
   * @param  {any} err
   */
  public handleWorkflowError = (err: any) => {
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
  public setRunningText({
    itemArr,
    index,
    runningSubText,
  }: {
    itemArr: any[];
    index: number;
    runningSubText: string;
  }) {
    if (!this.onItemShouldBeUpdate) {
      throw new Error('Renderer update funtions are not set!');
    }

    const swap = itemArr;
    swap[index] = {
      ...itemArr[index],
      subtitle: runningSubText,
    };

    this.onItemShouldBeUpdate({ items: swap, needIndexInfoClear: true });
  }

  /**
   * @summary
   * @return {boolean}
   */
  public hasNestedScriptFilters = (): boolean => {
    return (
      this.workStk.filter((work: Work) => work.type === 'scriptfilter')
        .length >= 2
    );
  }

  /**
   * @param  {PluginItem|Command} item
   */
  public setExecPath = (item: PluginItem | Command) => {
    // tslint:disable-next-line: no-string-literal
    this.execPath = item['isPluginItem']
      ? getPluginInstalledPath(item.bundleId!)
      : getWorkflowInstalledPath(item.bundleId!);
  }

  /**
   * @param  {Command | ScriptFilterItem | PluginItem} item
   * @param  {string} inputStr
   * @description If workStk is empty, return item's action
   *              otherwise, return nextAction (topWork's action)
   */
  public prepareActions = ({
    item,
    inputStr,
  }: {
    item: Command | ScriptFilterItem | PluginItem;
    inputStr: string;
  }): Action[] | undefined => {
    if (this.hasEmptyWorkStk()) {
      return (item as Command | PluginItem).action;
    } else {
      return this.getTopWork().action;
    }
  }

  /**
   * @param  {Command | ScriptFilterItem | PluginItem} item
   * @param  {string} inputStr
   * @return {object}
   * @description Returns args using according args extraction method
   */
  public prepareArgs = ({
    item,
    inputStr,
  }: {
    item: Command | ScriptFilterItem | PluginItem;
    inputStr: string;
  }): object => {
    let args;

    if (this.hasEmptyWorkStk() && item['isPluginItem']) {
      args = extractArgsFromPluginItem(item as PluginItem);
    } else if (this.hasEmptyWorkStk()) {
      const [_commandTitle, queryStr] = inputStr.split(
        (item as Command).command!
      );

      args = extractArgsFromQuery(
        queryStr ? queryStr.trim().split((item as Command).command!) : []
      );
    } else if (
      this.getTopWork().type === 'keyword' ||
      this.getTopWork().type === 'keyword-waiting'
    ) {
      args = extractArgsFromQuery(inputStr.split(' '));
    } else if (this.getTopWork().type === 'scriptfilter') {
      item = item as ScriptFilterItem;
      const vars = { ...item.variables, ...this.globalVariables! };
      args = extractArgsFromScriptFilterItem(item, vars);
    }

    return args;
  }

  /**
   * @param  {Action} nextAction
   * @param  {any} args
   * @return {string}
   */
  public getNextActionsInput = (nextAction: Action, args: any): string => {
    if (nextAction.type === 'scriptfilter') {
      return getAppliedArgsFromScript(
        extractScriptOnThisPlatform(nextAction.script_filter),
        args
      );
    }
    log(LogType.error, `Unsupported type, '${nextAction.type}'`);
    return 'Unsupported type error';
  }

  /**
   * @summary
   */
  public debugWorkStk = (): void => {
    if (!this.printWorkStack) return;

    log(LogType.info, '---------- Debug work stack ----------');
    for (const item of this.workStk) {
      log(LogType.info, item);
    }
    log(LogType.info, '--------------------------------------');
  }

  /**
   * @param  {string} str
   * @return {void}
   * @summary Update input of stack (Updated input could be used when popWork)
   */
  public renewInput = (str: string): void => {
    if (this.getTopWork().type === 'scriptfilter') {
      this.workStk[this.workStk.length - 1].input = str;
    }
  }

  /**
   * @param  {} item
   * @param  {} args
   * @param  {} targetActions
   * @param  {} modifier
   * @returns {boolean} If return false, commandExcute quits
   */
  private handleActionChain = ({
    item,
    args,
    targetActions,
    modifier,
  }: {
    item: Command | ScriptFilterItem | PluginItem;
    args: object;
    targetActions: Action[] | undefined;
    modifier: ModifierInput;
  }): boolean => {
    if (
      !this.onItemPressHandler ||
      !this.onInputShouldBeUpdate ||
      !this.onItemShouldBeUpdate ||
      !this.onWorkEndHandler
    ) {
      throw new Error('Renderer update funtions are not set!');
    }

    let handleActionResult: {
      nextActions: Action[];
      args: object;
    };

    const exists = (arr: any[] | undefined) => arr && arr.length > 0;

    while (exists(targetActions)) {
      // Handle Keyword Action
      // Assume
      if (targetActions![0].type === 'keyword') {
        handleKeywordWaiting(item, targetActions![0] as KeywordAction, args);
        return false;
      }

      handleActionResult = handleAction({
        actions: targetActions!,
        queryArgs: args,
        modifiersInput: modifier,
      });

      targetActions = handleActionResult.nextActions;

      if (exists(targetActions)) {
        for (const nextAction of targetActions!) {
          if (
            nextAction.type === 'scriptfilter' ||
            nextAction.type === 'keyword'
          ) {
            const nextInput = this.getNextActionsInput(
              nextAction,
              handleActionResult.args
            );

            this.pushWork({
              type: nextAction.type,
              input: nextInput,
              action: nextAction.action,
              actionTrigger: nextAction,
              bundleId: this.getTopWork().bundleId,
              args: handleActionResult.args,
              workProcess: null,
              workCompleted: false,
            });

            if (nextAction.type === 'scriptfilter') {
              scriptFilterExcute(nextInput);

              this.onInputShouldBeUpdate({
                str: nextInput + ' ',
                needItemsUpdate: false,
              });

            } else if (nextAction.type === 'keyword') {
              setKeywordItem(nextAction as KeywordAction);

              this.onInputShouldBeUpdate({
                str: '',
                needItemsUpdate: false,
              });
            }

            this.onItemPressHandler();
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * @param  {Command|ScriptFilterItem|PluginItem} item
   * @param  {string} inputStr
   * @param  {ModifierInput} modifier
   * @summary Handler for enter event
   */
  public async commandExcute(
    item: Command | ScriptFilterItem | PluginItem,
    inputStr: string,
    modifier: ModifierInput
  ): Promise<void> {
    if (
      !this.onItemPressHandler ||
      !this.onInputShouldBeUpdate ||
      !this.onItemShouldBeUpdate ||
      !this.onWorkEndHandler
    ) {
      throw new Error('Renderer update funtions are not set!');
    }

    // Ignore this exeution if previous work is pending.
    if (this.workIsPending()) {
      return;
    }

    // If workStk is empty, the args becomes query, otherwise args becomes arg of items
    // If workStk is empty, the actions becomes command, otherwise the top action of the stack is 'actions'.
    const actions = this.prepareActions({ item, inputStr });
    const args = this.prepareArgs({ item, inputStr });

    if (this.hasEmptyWorkStk()) {
      // type: one of 'keyword', 'scriptfilter', 'hotkey'
      this.pushWork({
        args,
        input: inputStr,
        action: actions,
        actionTrigger: item as Command | PluginItem,
        type: (item as Command | PluginItem).type,
        bundleId: (item as Command | PluginItem).bundleId!,
      });

      this.setExecPath(item as Command | PluginItem);
    }

    // Renew input
    this.renewInput(inputStr);

    if (!this.handleActionChain({ item, args, modifier, targetActions: actions })) {
      return;
    }

    console.log('clear!');
    this.clearWorkStack();
    this.onItemShouldBeUpdate({ items: [], needIndexInfoClear: true });
    this.onItemPressHandler();
    this.onWorkEndHandler();
  }
}
