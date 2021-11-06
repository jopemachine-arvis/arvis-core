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
import { exitify } from '../utils';
import extractJson from '../utils/extractJson';
import { handleAction } from './actionHandler';
import {
  applyExtensionVars,
  extractArgsFromHotkey,
  extractArgsFromPluginItem,
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
} from './argsHandler';
import { getPluginList } from './pluginList';
import { Renderer } from './rendererUpdater';
import { getWorkflowList } from './workflowList';

/**
 * Manage the execution of tasks
 * In the CUI, GUI, create a singleton object of this class to execute action, scriptfilter
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
  public printScriptfilter?: boolean;
  public printPluginItems?: boolean;
  public printVariables?: boolean;

  public maxRetrieveCount?: number;

  public isInitialTrigger?: boolean = true;

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
   * Cleanup trigger stack and other infomations
   */
  public clearTriggerStk = (): void => {
    if (this.printTriggerStack) {
      log(LogType.debug, 'Trigger stack cleared!');
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
   * @param trigger
   */
  public pushTrigger = (trigger: Trigger): void => {
    this.triggerStk.push(trigger);
    this.debugTriggerStk();
  }

  /**
   * If the script filters are nested, return to the previous script filter.
   */
  public popTrigger = (): void => {
    if (this.triggerStk.length >= 2) {
      if (this.getTopTrigger().type === 'hotkey') {
        // Double pop when executed through hotkey
        this.triggerStk.pop();
      }

      this.triggerStk.pop();
      if (this.getTopTrigger().type === 'scriptFilter') {
        Renderer.onItemShouldBeUpdate({
          items: this.getTopTrigger().items!,
          needIndexInfoClear: true,
        });
      } else if (this.getTopTrigger().type === 'keyword') {
        const keywordItem = (this.getTopTrigger().actionTrigger) as any;
        Renderer.onItemShouldBeUpdate({
          items: [{
            title: keywordItem.title,
            subtitle: keywordItem.subtitle
          }],
          needIndexInfoClear: true,
        });
      }

      Renderer.onInputShouldBeUpdate!({
        str: this.getTopTrigger().input,
        needItemsUpdate: false,
      });

      this.debugTriggerStk();
    } else if (this.triggerStk.length !== 0) {
      this.clearTriggerStk();
      Renderer.onInputShouldBeUpdate!({ str: '', needItemsUpdate: true });
    } else {
      this.clearTriggerStk();
      Renderer.onInputShouldBeUpdate!({ str: '', needItemsUpdate: true });
      Renderer.onWorkEndHandler();
    }
  }

  /**
   * When an error occurs, 'onItemShouldBeUpdate' is called by this method
   * And those error messages are displayed to the user in the form of items.
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
    if (options && options.extractJson === true && errorItems!.length >= 1) {
      if (errorItems) {
        Renderer.onItemShouldBeUpdate({
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

      Renderer.onItemShouldBeUpdate({
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
   * @param selectedItemIdx
   * @param modifiers
   */
  public setModifierOnScriptFilterItem = (
    selectedItemIdx: number,
    modifiers: Readonly<ModifierInput>
  ): void => {
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

    Renderer.onItemShouldBeUpdate!({ items, needIndexInfoClear: false });
  }

  /**
   * @summary
   */
  public clearModifierOnScriptFilterItem = (): void => {
    if (
      this.hasEmptyTriggerStk() ||
      this.getTopTrigger().type !== 'scriptFilter' ||
      !this.getTopTrigger().scriptfilterCompleted
    ) {
      return;
    }

    Renderer.onItemShouldBeUpdate!({
      items: this.getTopTrigger().items!,
      needIndexInfoClear: false,
    });
  }

  /**
   * @param err
   * @param options
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
   */
  public setRunningScriptfilterItem = ({ selectedItem, setRunningText }: { selectedItem: Command, setRunningText: boolean }): void => {
    if (setRunningText) {
      selectedItem.subtitle = selectedItem.runningSubtext ?? '';
    }

    Renderer.onItemShouldBeUpdate!({
      items: [selectedItem],
      needIndexInfoClear: true,
    });
  }

  /**
   * @param item
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
   * If triggerStk is empty, return item's actions
   * otherwise, return nextAction (top trigger's action)
   * @param item
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
   * Returns args using according args extraction method
   * @param item
   * @param inputStr
   */
  private prepareArgs = async ({
    item,
    inputStr,
  }: {
    item: Command | ScriptFilterItem | PluginItem;
    inputStr: string;
  }): Promise<Record<string, any>> => {
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
        await extractArgsFromPluginItem(item as PluginItem),
        extensionVariables
      );
    }

    // Workflow Trigger: Hotkey
    if (this.hasEmptyTriggerStk() && (item as Command).type === 'hotkey') {
      return applyExtensionVars(
        await extractArgsFromHotkey(),
        extensionVariables
      );
    }

    // Workflow Trigger: Keyword, scriptfilter
    if (this.hasEmptyTriggerStk()) {
      const [_emptyStr, queryStr] = inputStr.split(
        (item as Command).command!
      );

      return applyExtensionVars(
        await extractArgsFromQuery(
          queryStr ? queryStr.trim().split((item as Command).command!) : []
        ),
        extensionVariables
      );
    }

    if (this.getTopTrigger().type === 'keyword') {
      return applyExtensionVars(
        await extractArgsFromQuery(inputStr.split(' ')),
        extensionVariables
      );
    }

    // Handle scriptfilter action
    if (this.getTopTrigger().type === 'scriptFilter') {
      const vars = { ...(item as ScriptFilterItem).variables, ...this.globalVariables! };
      return applyExtensionVars(
        await extractArgsFromScriptFilterItem((item as ScriptFilterItem), vars),
        extensionVariables
      );
    }

    log(LogType.error, 'Args type infer failed');
    return emptyQuery;
  }

  /**
   * This function handle Trigger as Actions.
   * Which means keyword, scriptfilter.
   * If one of those would be Action, force users to enter input and enter again.
   * @param triggerAction
   * @param args
   */
  private handleTriggerAction = (triggerAction: TriggerAction, args: Record<string, any>): void => {
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

        Renderer.onInputShouldBeUpdate!({
          str: nextInput + optionalWhitespace,
          needItemsUpdate: false,
        });
      } else if (triggerAction.type === 'keyword') {
        handleKeywordAction(triggerAction as KeywordAction);

        Renderer.onInputShouldBeUpdate!({
          str: nextInput + optionalWhitespace,
          needItemsUpdate: false,
        });
      }

      Renderer.onItemPressHandler!();
      return;
    }
  }

  /**
   * @param action
   */
  private hasAsyncActionChain = (action: Action): boolean => {
    return !_.isUndefined((action as AsyncAction).asyncChain);
  }

  /**
   * Actions after async action (like script) must be executed after the async action is completed.
   * This function handle these async action chain.
   * Actions after async action are removed from targetActions.
   * And return this targetActions.
   * @param item
   * @param args
   * @param targetActions
   * @param modifier
   * @param nextAction
   * @returns actions
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
      if (!_.isUndefined(result)) {
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
            break;
        }
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
   * @returns top trigger's parent action type.
   */
  private getParentActionType = (): string | undefined => {
    if (!this.getTopTrigger() || !this.hasEmptyTriggerStk()) return undefined;
    const { actionTrigger } = this.getTopTrigger();

    return actionTrigger
      ? (actionTrigger as (Action | Command | PluginItem)).type
      : undefined;
  }

  /**
   * @returns
   */
  private forwardifyTriggers = (actionsPointer: Action[]): Action[] => {
    return actionsPointer.sort((actionA, actionB) => {
      const aIsTrig = triggerTypes.includes(actionA.type);
      const bIsTrig = triggerTypes.includes(actionB.type);
      if ((aIsTrig && !bIsTrig) || (!aIsTrig && bIsTrig)) return 1;
      return -1;
    });
  }

  /**
   * Handle Multiple Actions, Process a sequence of actions that follow back.
   * @returns If return false, 'commandExcute' quits to enable users to give more input
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
    const actionFlowManager = ActionFlowManager.getInstance();

    let handleActionResult: {
      nextActions: Action[];
      args: Record<string, any>;
    } = { args, nextActions: [] };

    let quit = true;
    let actionsPointer: Action[] | undefined = targetActions ?
      this.forwardifyTriggers([...targetActions]) :
      [];

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
   * @param vars
   */
  public printVariableInfo = (vars: Record<string, any>) => {
    if (this.printVariables) {
      log(LogType.info, vars);
    }
  }

  /**
   * Handle command item properly.
   * If return value is 'false', need more user input
   * @param item
   * @param inputStr
   * @param modifier
   * @returns If return value is true, no need more user input
   */
  public async commandExcute(
    item: Command | ScriptFilterItem | PluginItem,
    inputStr: string,
    modifier: Readonly<ModifierInput>
  ): Promise<boolean> {
    // If triggerStk is empty, the actions becomes command, otherwise the top action of the stack is 'actions'.
    // If triggerStk is empty, the args becomes query, otherwise args becomes arg of items
    const actions: Action[] | undefined = this.prepareNextActions({ item });
    const { exit, value: args } = await exitify(this.prepareArgs)({ item, inputStr });
    if (exit) return true;

    this.printVariableInfo(args);

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
   * Handler for enter event.
   * Handle command item properly and call renderer update functions
   * @param item
   * @param inputStr
   * @param modifier
   */
  public async handleItemPressEvent(
    item: Command | ScriptFilterItem | PluginItem,
    inputStr: string,
    modifier: Readonly<ModifierInput>
  ): Promise<void> {
    // Ignore this exeution if previous work is pending.
    if (this.prevScriptfilterIsExecuting()) {
      return;
    }

    const quit: boolean = await this.commandExcute(item, inputStr, modifier);

    if (quit) {
      this.clearTriggerStk();
      Renderer.onItemShouldBeUpdate!({ items: [], needIndexInfoClear: true });
      Renderer.onItemPressHandler!();
      Renderer.onWorkEndHandler();
    }
  }
}
