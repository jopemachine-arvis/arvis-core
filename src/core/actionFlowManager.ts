// tslint:disable: no-string-literal

import _ from 'lodash';
import { handleKeywordAction, handleResetInputAction } from '../actions';
import { scriptFilterExcute } from '../actions/scriptFilter';
import { log, LogType, pushInputStrLog } from '../config';
import {
  getPluginInstalledPath,
  getWorkflowInstalledPath,
} from '../config/path';
import { triggerTypes } from '../lib/triggerTypes';
import extractJson from '../utils/extractJson';
import { handleAction } from './actionHandler';
import {
  applyExtensionVars,
  extractArgsFromPluginItem,
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
} from './argsHandler';
import { getPluginList } from './pluginList';
import { getWorkflowList } from './workflowList';

/**
 * @description Manage the execution of tasks
 *              In the CUI, GUI, create a singleton object of this class to execute action, scriptfilter
 */
export class ActionFlowManager {
  private static instance: ActionFlowManager;

  static getInstance(): ActionFlowManager {
    if (!ActionFlowManager.instance) {
      ActionFlowManager.instance = new ActionFlowManager();
    }
    return ActionFlowManager.instance;
  }

  triggerStk: Trigger[];
  globalVariables?: Record<string, any>;
  rerunTimer?: NodeJS.Timeout | undefined;

  extensionInfo?: {
    type: 'workflow' | 'plugin';
    execPath?: string;
    name?: string;
    version?: string;
  };

  // For debugging, set below variables
  public printActionType?: boolean;
  public printTriggerStack?: boolean;
  public printScriptOutput?: boolean;
  public printArgs?: boolean;
  public printScriptfilter?: boolean;
  public printPluginItems?: boolean;

  public loggerColorType?: 'cui' | 'gui' = 'cui';

  public maxRetrieveCount?: number;

  public isInitialTrigger?: boolean = true;

  public onWorkEndHandler?: () => void;
  public onItemPressHandler?: () => void;

  public onItemShouldBeUpdate?: ({
    items,
    needIndexInfoClear,
  }: {
    items: (ScriptFilterItem | Command)[];
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
    this.triggerStk = [];
    this.globalVariables = {};
  }

  /**
   * @summary
   */
  public getTopTrigger = (): Trigger => {
    return this.triggerStk[this.triggerStk.length - 1];
  }

  /**
   * @summary
   * @description cleanup work stack and other infomations
   */
  public clearTriggerStk = (): void => {
    if (this.printTriggerStack) {
      log(LogType.info, 'Trigger stack cleared!');
    }

    this.triggerStk.length = 0;
    this.globalVariables = {};
    this.rerunTimer = undefined;
    this.isInitialTrigger = true;
    this.extensionInfo = undefined;
  }

  /**
   * @summary
   */
  public updateTopTrigger = (keyValueDict: Record<string, any>): void => {
    for (const key of Object.keys(keyValueDict)) {
      this.triggerStk[this.triggerStk.length - 1][key] = keyValueDict[key];
    }
  }

  /**
   * @summary
   */
  public hasEmptyTriggerStk = (): boolean => {
    return this.triggerStk.length === 0;
  }

  /**
   * @summary
   */
  public prevScriptfilterIsExecuting = (): boolean => {
    if (this.hasEmptyTriggerStk() || this.getTopTrigger().type !== 'scriptFilter')
      return false;

    return this.getTopTrigger().scriptfilterCompleted === false;
  }

  /**
   * @param {Trigger} trigger
   */
  public pushTrigger = (trigger: Trigger): void => {
    this.triggerStk.push(trigger);
    this.debugTriggerStk();
  }

  /**
   * @summary If the script filters are nested, return to the previous script filter.
   */
  public popTrigger = (): void => {
    this.throwErrOnRendererUpdaterNotSet();

    if (this.triggerStk.length >= 2) {
      if (this.getTopTrigger().type === 'hotkey') {
        // Double pop when executed through hotkey
        this.triggerStk.pop();
      }

      this.triggerStk.pop();
      if (this.getTopTrigger().type === 'scriptFilter') {
        this.onItemShouldBeUpdate!({
          items: this.getTopTrigger().items!,
          needIndexInfoClear: true,
        });
      } else if (this.getTopTrigger().type === 'keyword') {
        const keywordItem = (this.getTopTrigger().actionTrigger) as any;
        this.onItemShouldBeUpdate!({
          items: [{
            title: keywordItem.title,
            subtitle: keywordItem.subtitle
          }],
          needIndexInfoClear: true,
        });
      }

      this.onInputShouldBeUpdate!({
        str: this.getTopTrigger().input,
        needItemsUpdate: false,
      });

      this.debugTriggerStk();
    } else if (this.triggerStk.length !== 0) {
      this.clearTriggerStk();
      this.onInputShouldBeUpdate!({ str: '', needItemsUpdate: true });
    } else {
      this.clearTriggerStk();
      this.onInputShouldBeUpdate!({ str: '', needItemsUpdate: true });
      this.onWorkEndHandler!();
    }
  }

  /**
   * @summary When an error occurs, onItemShouldBeUpdate is called by this method
   *          And those error messages are displayed to the user in the form of items.
   */
  public setErrorItem = ({
    error,
    errorItems,
    options,
  }: {
    error?: any;
    errorItems?: ScriptFilterItem[];
    options?: { extractJson?: boolean } | undefined;
  }): void => {
    if (!this.onItemShouldBeUpdate) {
      throw new Error('Renderer update funtions are not set!');
    }

    if (options && options.extractJson === true && errorItems!.length >= 1) {
      if (errorItems) {
        this.onItemShouldBeUpdate({
          items: errorItems,
          needIndexInfoClear: true,
        });
      } else {
        throw new Error(
          '"options.extractJson" is set but errorItems is not given.'
        );
      }
    } else {
      if (!error) {
        throw new Error(
          '"options.extractJson" is false or errorItems is empty. but error is not given.'
        );
      }

      this.onItemShouldBeUpdate({
        items: [
          {
            bundleId: 'error',
            valid: false,
            title: error.name,
            subtitle: error.message,
            text: {
              copy: error.message,
              largetype: error.message,
            },
          },
        ],
        needIndexInfoClear: true,
      });
    }
  }

  /**
   * @param  {number} selectedItemIdx
   * @param  {Readonly<ModifierInput>} modifiers
   */
  public setModifierOnScriptFilterItem = (
    selectedItemIdx: number,
    modifiers: Readonly<ModifierInput>
  ): void => {
    this.throwErrOnRendererUpdaterNotSet();

    if (
      this.hasEmptyTriggerStk() ||
      this.getTopTrigger().type !== 'scriptFilter' ||
      !this.getTopTrigger().scriptfilterCompleted
    ) {
      return;
    }

    const pressedModifier: string = _.filter(
      Object.keys(modifiers),
      (modifier: string) => {
        return modifiers[modifier] === true ? true : false;
      }
    )[0];

    const items: ScriptFilterItem[] | undefined = _.map(this.getTopTrigger().items, _.cloneDeep);

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

    this.onItemShouldBeUpdate!({ items, needIndexInfoClear: false });
  }

  /**
   * @summary
   */
  public clearModifierOnScriptFilterItem = (): void => {
    this.throwErrOnRendererUpdaterNotSet();

    if (
      this.hasEmptyTriggerStk() ||
      this.getTopTrigger().type !== 'scriptFilter' ||
      !this.getTopTrigger().scriptfilterCompleted
    ) {
      return;
    }

    this.onItemShouldBeUpdate!({
      items: this.getTopTrigger().items!,
      needIndexInfoClear: false,
    });
  }

  /**
   * @param  {any} err
   * @param  {any} options
   */
  public handleScriptFilterError = (
    err: any,
    options?: { extractJson?: boolean } | undefined
  ): void => {
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

    this.setErrorItem({ error: err, errorItems, options });
  }

  /**
   * @description
   */
  public setRunningScriptfilterItem = ({ selectedItem, setRunningText }: { selectedItem: Command, setRunningText: boolean }): void => {
    this.throwErrOnRendererUpdaterNotSet();

    if (setRunningText) {
      selectedItem.subtitle = selectedItem.runningSubtext ?? '';
    }

    this.onItemShouldBeUpdate!({
      items: [selectedItem],
      needIndexInfoClear: true,
    });
  }

  /**
   * @param  {PluginItem|Command} item
   */
  public setExtensionInfo = (item: PluginItem | Command): void => {
    if ((item as PluginItem).isPluginItem) {
      this.extensionInfo = {
        execPath: getPluginInstalledPath(item.bundleId!),
        name: getPluginList()[item.bundleId!].name,
        version: getPluginList()[item.bundleId!].version,
        type: 'plugin',
      };
    } else {
      this.extensionInfo = {
        execPath: getWorkflowInstalledPath(item.bundleId!),
        name: getWorkflowList()[item.bundleId!].name,
        version: getWorkflowList()[item.bundleId!].version,
        type: 'workflow',
      };
    }
  }

  /**
   * @summary
   */
  public debugTriggerStk = (): void => {
    if (!this.printTriggerStack) return;

    log(LogType.info, '* ---------- Debug trigger stack ---------- *');
    for (const item of this.triggerStk) {
      log(LogType.info, item);
    }
    log(LogType.info, '* ----------------------------------------- *');
  }

  /**
   * @param  {Command | ScriptFilterItem | PluginItem} item
   * @param  {Record<string, any>} args
   * @description If triggerStk is empty, return item's action
   *              otherwise, return nextAction (topWork's action)
   */
  private prepareNextActions = ({
    item,
  }: {
    item: Command | ScriptFilterItem | PluginItem;
  }): Action[] | undefined => {
    if (this.hasEmptyTriggerStk()) {
      return (item as Command | PluginItem).actions;
    } else {
      return this.getTopTrigger().actions;
    }
  }

  /**
   * @param  {Command | ScriptFilterItem | PluginItem} item
   * @param  {string} inputStr
   * @return {Record<string, any>}
   * @description Returns args using according args extraction method
   */
  private prepareArgs = ({
    item,
    inputStr,
  }: {
    item: Command | ScriptFilterItem | PluginItem;
    inputStr: string;
  }): Record<string, any> => {
    const bundleId: string = this.hasEmptyTriggerStk()
      ? item.bundleId!
      : this.getTopTrigger().bundleId;

    const extensionVariables = (item as PluginItem).isPluginItem
      ? getPluginList()[bundleId].variables
      : getWorkflowList()[bundleId].variables ?? {};

    const emptyQuery = {
      '{query}': '',
      $1: '',
    };

    // Plugin Trigger
    if (this.hasEmptyTriggerStk() && (item as PluginItem).isPluginItem) {
      return applyExtensionVars(
        extractArgsFromPluginItem(item as PluginItem),
        extensionVariables
      );
    }

    // Workflow Trigger: Hotkey
    if (this.hasEmptyTriggerStk() && (item as Command).type === 'hotkey') {
      return applyExtensionVars(
        emptyQuery,
        extensionVariables
      );
    }

    // Workflow Trigger: Keyword, scriptfilter
    if (this.hasEmptyTriggerStk()) {
      const [_emptyStr, queryStr] = inputStr.split(
        (item as Command).command!
      );

      return applyExtensionVars(
        extractArgsFromQuery(
          queryStr ? queryStr.trim().split((item as Command).command!) : []
        ),
        extensionVariables
      );
    }

    if (this.getTopTrigger().type === 'keyword') {
      return applyExtensionVars(
        extractArgsFromQuery(inputStr.split(' ')),
        extensionVariables
      );
    }

    // Handle scriptfilter action
    if (this.getTopTrigger().type === 'scriptFilter') {
      const vars = { ...(item as ScriptFilterItem).variables, ...this.globalVariables! };
      return applyExtensionVars(
        extractArgsFromScriptFilterItem(item, vars),
        extensionVariables
      );
    }

    log(LogType.error, 'Args type infer failed');
    return emptyQuery;
  }

  /**
   * @param  {}
   */
  private throwErrOnRendererUpdaterNotSet = (): void => {
    if (
      !this.onItemPressHandler ||
      !this.onInputShouldBeUpdate ||
      !this.onItemShouldBeUpdate ||
      !this.onWorkEndHandler
    ) {
      throw new Error('Renderer update funtions are not set!');
    }
  }

  /**
   * @param  {TriggerAction} triggerAction
   * @param  {Record<string, any>} args
   * @description This function handle Trigger as Actions.
   *              Which means keyword, scriptfilter.
   *              If one of those would be Action, force users to enter input and enter again.
   */
  private handleTriggerAction = (triggerAction: TriggerAction, args: Record<string, any>): void => {
    this.throwErrOnRendererUpdaterNotSet();

    if (triggerAction.type === 'resetInput') {
      handleResetInputAction((triggerAction as ResetInputAction).newInput);
      return;
    }

    if (triggerAction.type === 'scriptFilter' || triggerAction.type === 'keyword') {
      const nextInput = args['{query}'] ?? '';
      const optionalWhitespace = (triggerAction as ScriptFilterAction | KeywordAction).argType === 'required' ? ' ' : '';

      this.pushTrigger({
        actions: (triggerAction as ScriptFilterAction | KeywordAction).actions,
        actionTrigger: triggerAction,
        args,
        bundleId: this.getTopTrigger().bundleId,
        input: nextInput,
        type: triggerAction.type,
        scriptfilterCompleted: false,
        scriptfilterProc: null,
      });

      if (triggerAction.type === 'scriptFilter') {
        scriptFilterExcute(nextInput);

        this.onInputShouldBeUpdate!({
          str: nextInput + optionalWhitespace,
          needItemsUpdate: false,
        });
      } else if (triggerAction.type === 'keyword') {
        handleKeywordAction(triggerAction as KeywordAction);

        this.onInputShouldBeUpdate!({
          str: nextInput + optionalWhitespace,
          needItemsUpdate: false,
        });
      }

      this.onItemPressHandler!();
      return;
    }
  }

  /**
   * @param  {Action} action
   */
  private hasAsyncActionChain = (action: Action): boolean => {
    return !_.isUndefined((action as AsyncAction).asyncChain);
  }

  /**
   * @param  {Command|ScriptFilterItem|PluginItem} item
   * @param  {Record<string, any>} args
   * @param  {Action[]} targetActions
   * @param  {Readonly<ModifierInput>} modifier
   * @param  {AsyncAction} nextAction
   * @description Actions after async action (like script) must be executed after the async action is completed.
   *              This function handle these async action chain.
   *              Actions after async action are removed from targetActions.
   *              And return this targetActions.
   */
  private handleAsyncActionChain = (
    item: Command | ScriptFilterItem | PluginItem,
    args: Record<string, any>,
    targetActions: Action[],
    modifier: Readonly<ModifierInput>,
    nextAction: AsyncAction
  ): Action[] => {
    if (!nextAction.asyncChain || !nextAction.asyncChainType) {
      throw new Error('Action doesn\'t have asyncChain!');
    }

    targetActions = targetActions.filter(
      (targetAction) => targetAction !== nextAction
    );

    nextAction.asyncChain.then((result: any) => {
      switch (nextAction.asyncChainType) {
        case 'script': {
          args['{query}'] = result.all;
          args['$1'] = result.all;
          break;
        }
        case 'clipboard': {
          args['{query}'] = result;
          args['$1'] = result;
          break;
        }
        default:
          // Do not handle this!
          break;
      }

      this.handleActionChain({
        item,
        args,
        modifier,
        targetActions: [nextAction],
      });
    });

    return targetActions;
  }

  /**
   * @description return top trigger's parent action type.
   */
  private getParentActionType = (): string | undefined => {
    if (!this.getTopTrigger() || !this.hasEmptyTriggerStk()) return undefined;
    const { actionTrigger } = this.getTopTrigger();

    return actionTrigger
      ? (actionTrigger as (Action | Command | PluginItem)).type
      : undefined;
  }

  /**
   * @returns {boolean} If return false, commandExcute quits to enable users to give more input
   * @description Handle Multiple Actions, Process a sequence of actions that follow back.
   */
  private handleActionChain = ({
    item,
    args,
    targetActions,
    modifier,
  }: {
    item: Command | ScriptFilterItem | PluginItem;
    args: Record<string, any>;
    targetActions: Action[];
    modifier: Readonly<ModifierInput>;
  }): boolean => {
    this.throwErrOnRendererUpdaterNotSet();
    const actionFlowManager = ActionFlowManager.getInstance();

    let handleActionResult: {
      nextActions: Action[];
      args: Record<string, any>;
    } = { args, nextActions: [] };

    let quit = true;
    let actionsPointer: Action[] | undefined = targetActions ? [...targetActions] : [];

    actionsPointer.sort((actionA, actionB) => {
      const aIsTrig = triggerTypes.includes(actionA.type);
      const bIsTrig = triggerTypes.includes(actionB.type);
      if ((aIsTrig && !bIsTrig) || (!aIsTrig && bIsTrig)) return 1;
      return -1;
    });

    while (actionsPointer.length > 0) {
      const parentActionType: string | undefined = this.getParentActionType();

      const needToPreventQuit = triggerTypes.includes(actionsPointer[0].type) &&
        (!actionFlowManager.isInitialTrigger ||
          (parentActionType && triggerTypes.includes(parentActionType)));

      if (needToPreventQuit) {
        this.handleTriggerAction(actionsPointer[0] as TriggerAction, args);
        actionFlowManager.isInitialTrigger = false;
        quit = false;
        actionsPointer.splice(0, 1);
        continue;
      } else {
        handleActionResult = handleAction({
          actions: actionsPointer,
          queryArgs: args,
          modifiersInput: modifier,
        });

        actionsPointer = handleActionResult.nextActions;
      }

      if (actionsPointer) {
        for (const nextAction of actionsPointer) {
          if (this.hasAsyncActionChain(nextAction)) {
            actionsPointer = this.handleAsyncActionChain(
              item,
              args,
              actionsPointer,
              modifier,
              nextAction
            );
          }

          if (nextAction.type === 'resetInput') {
            actionsPointer = [];
          }

          if (triggerTypes.includes(nextAction.type)) {
            this.handleTriggerAction(nextAction as TriggerAction, handleActionResult.args);
            quit = false;
          }
        }
      }
    }

    return quit;
  }

  /**
   * @param  {Command|ScriptFilterItem|PluginItem} item
   * @param  {string} inputStr
   * @param  {Readonly<ModifierInput>} modifier
   * @summary Handle command item properly
   * @returns {boolean} If return value is true, no need more user input
   *                    If return value is false, need more user input
   */
  public commandExcute(
    item: Command | ScriptFilterItem | PluginItem,
    inputStr: string,
    modifier: Readonly<ModifierInput>
  ): boolean {
    // If triggerStk is empty, the actions becomes command, otherwise the top action of the stack is 'actions'.
    // If triggerStk is empty, the args becomes query, otherwise args becomes arg of items
    const actions: Action[] | undefined = this.prepareNextActions({ item });
    const args: Record<string, any> = this.prepareArgs({ item, inputStr });

    if (this.hasEmptyTriggerStk()) {
      // Trigger Type: one of 'keyword', 'scriptFilter'
      this.pushTrigger({
        actions,
        actionTrigger: item as Command | PluginItem,
        args,
        bundleId: (item as Command | PluginItem).bundleId!,
        input: inputStr,
        type: (item as Command | PluginItem).type,
      });

      this.setExtensionInfo(item as Command | PluginItem);
      pushInputStrLog(item.bundleId!, (item as PluginItem).isPluginItem ? (item as PluginItem).title : (item as Command).command!);

    } else {
      this.isInitialTrigger = false;
    }

    if (this.getTopTrigger().type === 'scriptFilter') {
      this.updateTopTrigger({
        input: inputStr
      });
    }

    return this.handleActionChain({
      item,
      args,
      modifier,
      targetActions: actions ?? [],
    });
  }

  /**
   * @param  {Command|ScriptFilterItem|PluginItem} item
   * @param  {string} inputStr
   * @param  {Readonly<ModifierInput>} modifier
   * @summary Handler for enter event.
   *          Handle command item properly and call renderer update functions
   */
  public handleItemPressEvent(
    item: Command | ScriptFilterItem | PluginItem,
    inputStr: string,
    modifier: Readonly<ModifierInput>
  ): void {
    this.throwErrOnRendererUpdaterNotSet();

    // Ignore this exeution if previous work is pending.
    if (this.prevScriptfilterIsExecuting()) {
      return;
    }

    const quit: boolean = this.commandExcute(item, inputStr, modifier);

    if (quit) {
      this.clearTriggerStk();
      this.onItemShouldBeUpdate!({ items: [], needIndexInfoClear: true });
      this.onItemPressHandler!();
      this.onWorkEndHandler!();
    }
  }
}
