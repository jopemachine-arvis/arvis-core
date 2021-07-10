import chalk from 'chalk';
import _ from 'lodash';
import {
  argsExtract as argsExtractAction,
  copyToClipboard as copyToClipboardAction,
  customActions as customActions,
  handleScriptAction as handleScriptAction,
  openFile as openFileAction,
} from '../actions';
import { log, LogType, pushActionLog } from '../config';
import { escapeBraket } from '../utils';
import { ActionFlowManager } from './actionFlowManager';
import { applyArgsInAction } from './argsHandler';
import { handleModifiers } from './modifierHandler';

/**
 * @summary
 */
const printActionDebuggingLogOnCUI = (
  action: Action,
  color: Function,
  extra: any
) => {
  log(LogType.info, color(`[Action: ${action.type}] `), action, extra);
};

/**
 * @summary
 */
const printActionDebuggingLogOnGUI = (
  action: Action,
  color: string,
  extra: any
) => {
  log(
    LogType.info,
    `%c[Action: ${action.type}]%c `,
    `color: ${color}`,
    'color: unset',
    action,
    extra
  );
};

/**
 * @summary
 */
const printActionDebuggingLog = ({
  cuiColorApplier,
  guiColor,
  action,
  extra = '',
}: {
  cuiColorApplier: Function;
  guiColor: string;
  action: Action;
  extra?: any;
}) => {
  const actionFlowManager = ActionFlowManager.getInstance();
  if (!actionFlowManager.printActionType) return;

  if (actionFlowManager.loggerColorType === 'cui') {
    printActionDebuggingLogOnCUI(action, cuiColorApplier, extra);
  } else if (actionFlowManager.loggerColorType === 'gui') {
    printActionDebuggingLogOnGUI(action, guiColor, extra);
  }
};

/**
 * @param  {string} typeName
 * @param  {string[]} requiredAttributes
 * @description If there is no required attribute in the execution of the action, it throws an error.
 */
const throwReqAttrNotExtErr = (
  typeName: string,
  requiredAttributes: string[]
) => {
  throw new Error(
    `'${typeName}' type should have '${requiredAttributes.join(
      ', '
    )}' attributes`
  );
};

/**
 * @param  {Action} action
 */
const resolveActionType = (action: Action) => {
  return action.type;
};

/**
 * @param  {Action[]} actions
 * @param  {Record<string, any>} queryArgs
 * @param  {ModifierInput} modifiersInput
 * @summary The actions arrangement is taken as a factor to branch according to cond or modifiers.
 */
function handleAction({
  actions,
  queryArgs,
  modifiersInput,
}: {
  actions: Action[];
  queryArgs: Record<string, any>;
  modifiersInput: ModifierInput;
}): {
  nextActions: Action[];
  args: Record<string, any>;
} {
  const actionFlowManager = ActionFlowManager.getInstance();
  actions = handleModifiers(actions, modifiersInput);

  let nextActions: Action[] = [];

  _.map(actions, (action) => {
    const type = resolveActionType(action);

    let nextAction: Action[] | undefined;
    let asyncChain: Promise<any> | undefined;
    let asyncChainType: string | undefined;

    // tslint:disable-next-line: no-string-literal
    nextAction = action['actions'];

    action = applyArgsInAction(queryArgs, action);

    pushActionLog(actionFlowManager.getTopTrigger().bundleId, action);

    if (customActions[action.type]) {
      customActions[action.type](action);
      return;
    }

    try {
      switch (type) {
        case 'script':
          action = action as ScriptAction;
          if (!action.script) throwReqAttrNotExtErr(type, ['script']);

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.redBright,
            guiColor: 'red',
            extra: `script executed: '${action.script}'`,
          });

          actionFlowManager.isInitialTrigger = false;
          asyncChain = handleScriptAction(action, queryArgs);
          asyncChainType = action.type;
          break;

        // Scriptfilter cannot be processed here because it could be ran in a way other than 'Enter' event
        // Because the action is not processed here, so it passes action as nextAction, not action.action
        case 'scriptFilter':
          action = action as ScriptFilterAction;
          if (!action.scriptFilter) {
            throwReqAttrNotExtErr(type, ['scriptFilter']);
          }

          actionFlowManager.isInitialTrigger = false;
          nextAction = [action];
          break;

        // Just execute next action if it is trigger.
        // In case of keyword action, wait for next user input
        case 'keyword':
          action = action as KeywordAction;
          if (!action.command && !action.title) {
            throwReqAttrNotExtErr(type, ['command | title']);
          }

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.blackBright,
            guiColor: 'black',
          });

          const nextFirstAction = action['actions']
            ? action['actions'][0]
            : undefined;

          if (
            actionFlowManager.isInitialTrigger &&
            (!nextFirstAction ||
              ['keyword', 'scriptFilter'].includes(nextFirstAction.type))
          ) {
            actionFlowManager.isInitialTrigger = false;

            if (nextAction) {
              nextAction = handleAction({
                actions: nextAction,
                queryArgs,
                modifiersInput,
              }).nextActions;
            }
          } else {
            // Wait for next 'user enter press' event
            nextAction = undefined;
          }

          actionFlowManager.isInitialTrigger = false;
          break;

        // Open specific program, url..
        case 'open':
          action = action as OpenAction;
          if (!action.target) throwReqAttrNotExtErr(type, ['target']);

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.blueBright,
            guiColor: 'blue',
            extra: `open target: '${action.target}'`,
          });

          actionFlowManager.isInitialTrigger = false;

          openFileAction(action.target);
          break;

        // Notification (Not implemented on here)
        case 'notification':
          action = action as NotiAction;
          break;

        // Copy text to clipboard
        case 'clipboard':
          action = action as ClipboardAction;
          if (!action.text) throwReqAttrNotExtErr(type, ['text']);

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.greenBright,
            guiColor: 'green',
            extra: `copied string: '${action.text}'`,
          });

          actionFlowManager.isInitialTrigger = false;

          asyncChain = copyToClipboardAction(action.text);
          asyncChainType = action.type;

          break;

        // Extract query from args, vars and execute the action.
        case 'args':
          action = action as ArgsAction;
          if (!action.arg) throwReqAttrNotExtErr(type, ['arg']);

          const argToExtract = escapeBraket(action.arg).trim();
          const nextQueryArgs = argsExtractAction(queryArgs, argToExtract);

          actionFlowManager.isInitialTrigger = false;

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.blueBright,
            guiColor: 'blue',
            extra: `arg extracted: '${nextQueryArgs['{query}']}'`,
          });

          if (nextAction) {
            nextAction = handleAction({
              actions: nextAction,
              queryArgs: nextQueryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;

        // Run 'cond' as eval to determine if true.
        // And run 'then' actions if cond is true, else run 'else' actions.
        case 'cond':
          action = action as CondAction;
          if (!action.if) throwReqAttrNotExtErr(type, ['if']);
          if (!action.if.cond || !action.if.actions) {
            throwReqAttrNotExtErr('if', ['cond', 'actions']);
          }
          if (!action.if.actions.then) {
            throwReqAttrNotExtErr('action of cond type', ['then']);
          }

          let condIsTrue: boolean;

          try {
            // tslint:disable-next-line: no-eval
            condIsTrue = eval(action.if.cond) === true;
          } catch (err) {
            console.error(
              `Below error occured while evaling cond target. target is evaluated by false.\n${err}`
            );
            condIsTrue = false;
          }

          // To do:: Fix below logic safely
          const conditionalAction = condIsTrue
            ? action.if.actions.then
            : action.if.actions.else;

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.magentaBright,
            guiColor: 'magenta',
            extra: `condition is evaluated by '${condIsTrue}'`,
          });

          actionFlowManager.isInitialTrigger = false;

          if (conditionalAction) {
            nextAction = handleAction({
              actions: conditionalAction,
              queryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;

        case 'resetInput': {
          action = action as ResetInputAction;

          nextAction = [action];

          actionFlowManager.isInitialTrigger = false;
          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.blackBright,
            guiColor: 'black',
            extra: `reset input by '${action.newInput}'`,
          });
          break;
        }

        case 'hotkey':
          log(LogType.error, 'Error: hotkey action should be most front');
          break;

        default:
          log(LogType.error, 'Error: Not supported type, ' + type);
          break;
      }
    } catch (e) {
      log(LogType.error, e);
    }

    if (nextAction) {
      if (asyncChain) {
        nextAction.forEach((targetAction) => {
          targetAction['asyncChain'] = asyncChain;
          targetAction['asyncChainType'] = asyncChainType;
        });
      }

      nextActions = [...nextActions, ...nextAction];
    }
  });

  // Theoretically, nextAction may have more than one script filter, but the case is not considered yet..

  return {
    nextActions: nextActions ?? [],
    args: queryArgs,
  };
}

export { handleAction };
