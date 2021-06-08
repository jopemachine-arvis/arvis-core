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
import { applyArgsToScript } from './argsHandler';
import { handleModifiers } from './modifierHandler';
import { extractScriptOnThisPlatform } from './scriptExtracter';
import { WorkManager } from './workManager';

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
  const workManager = WorkManager.getInstance();
  if (!workManager.printActionType) return;

  if (workManager.loggerColorType === 'cui') {
    printActionDebuggingLogOnCUI(action, cuiColorApplier, extra);
  } else if (workManager.loggerColorType === 'gui') {
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
    `'${typeName}' type should have '${requiredAttributes.join(' ')}' attribute`
  );
};

/**
 * @param  {Action} action
 */
const resolveActionType = (action: Action) => {
  const workManager = WorkManager.getInstance();

  if (
    !workManager.hasEmptyWorkStk() &&
    workManager.getTopWork().type === 'keyword-waiting' &&
    action.type.toLowerCase() === 'keyword'
  ) {
    return 'keyword-waiting-resolve';
  } else {
    return action.type.toLowerCase();
  }
};

/**
 * @param  {Action[]} actions
 * @param  {object} queryArgs
 * @param  {ModifierInput} modifiersInput
 * @summary The actions arrangement is taken as a factor to branch according to cond or modifiers.
 */
function handleAction({
  actions,
  queryArgs,
  modifiersInput,
}: {
  actions: Action[];
  queryArgs: object;
  modifiersInput: ModifierInput;
}): {
  nextActions: Action[];
  args: object;
} {
  const workManager = WorkManager.getInstance();
  actions = handleModifiers(actions, modifiersInput);

  let target;
  let nextActions: Action[] = [];

  _.map(actions, (action) => {
    const type = resolveActionType(action);

    let nextAction: Action[] | undefined;

    // tslint:disable-next-line: no-string-literal
    nextAction = action['action'];

    if (customActions[action.type]) {
      customActions[action.type](action);
      return;
    }

    pushActionLog(action);

    try {
      switch (type) {
        case 'script':
          action = action as ScriptAction;
          if (!action.script) throwReqAttrNotExtErr(type, ['script']);

          const scriptStr = extractScriptOnThisPlatform(action.script);
          target = applyArgsToScript({ scriptStr, queryArgs });

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.redBright,
            guiColor: 'red',
            extra: `Script executed: ${target}`,
          });
          handleScriptAction(action, queryArgs);
          break;

        // Scriptfilter cannot be processed here because it could be ran in a way other than 'Enter' event
        // Because the action is not processed here, so it passes action as nextAction, not action.action
        case 'scriptfilter':
          action = action as ScriptFilterAction;
          if (!action.script_filter)
            throwReqAttrNotExtErr(type, ['script_filter']);

          target = action.script_filter;
          nextAction = [action];
          break;

        case 'keyword-waiting-resolve':
          action = action as KeywordAction;
          target = action.title;

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.yellowBright,
            guiColor: 'black',
          });

          if (nextAction) {
            nextAction = handleAction({
              actions: nextAction,
              queryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;

        // Just execute next action if it is trigger.
        // In case of keyword action, wait for next user input
        case 'keyword':
          action = action as KeywordAction;
          if (!action.command && !action.title)
            throwReqAttrNotExtErr(type, ['command | title']);

          target = action.command || action.title;

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.yellowBright,
            guiColor: 'black',
          });

          if (workManager.getTopWork().type === 'keyword') {
            if (nextAction) {
              nextAction = handleAction({
                actions: nextAction,
                queryArgs,
                modifiersInput,
              }).nextActions;
            }
          } else {
            // Wait for next 'action' event
            nextAction = undefined;
          }
          break;

        // Push the work and execute next action
        case 'hotkey':
          action = action as HotkeyAction;
          if (!action.hotkey) throwReqAttrNotExtErr(type, ['hotkey']);

          target = action.hotkey;

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.whiteBright,
            guiColor: 'white',
          });

          if (nextAction) {
            nextAction = handleAction({
              actions: nextAction,
              queryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;

        // Open specific program, url..
        case 'open':
          action = action as OpenAction;
          if (!action.target) throwReqAttrNotExtErr(type, ['target']);

          target = applyArgsToScript({ scriptStr: action.target, queryArgs });

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.blueBright,
            guiColor: 'blue',
            extra: `Open target: ${target}`,
          });

          openFileAction(target);
          break;

        // Notification (Not implemented on here)
        case 'notification':
          action = action as NotiAction;
          break;

        // Copy text to clipboard
        case 'clipboard':
          action = action as ClipboardAction;
          if (!action.text) throwReqAttrNotExtErr(type, ['text']);

          target = applyArgsToScript({ scriptStr: action.text, queryArgs });

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.greenBright,
            guiColor: 'green',
            extra: `Copied string: ${target}`,
          });

          copyToClipboardAction(target);
          break;

        // Extract query from args, vars and execute the action.
        case 'args':
          action = action as ArgsAction;
          if (!action.arg) throwReqAttrNotExtErr(type, ['arg']);

          const argToExtract = escapeBraket(action.arg).trim();
          queryArgs = argsExtractAction(queryArgs, argToExtract);
          target = queryArgs;

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.blueBright,
            guiColor: 'blue',
          });

          if (nextAction) {
            nextAction = handleAction({
              actions: nextAction,
              queryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;

        // Run 'cond' as eval to determine if true.
        // And run 'then' actions if cond is true, else run 'else' actions.
        case 'cond':
          action = action as CondAction;
          if (!action.if) throwReqAttrNotExtErr(type, ['if']);
          if (!action.if.cond || !action.if.action)
            throwReqAttrNotExtErr('if', ['cond', 'action']);
          if (!action.if.action.then)
            throwReqAttrNotExtErr('action of cond type', ['then']);

          target = applyArgsToScript({
            scriptStr: action.if.cond,
            queryArgs,
            appendQuotes: true,
          });

          let isTrue;
          try {
            // tslint:disable-next-line: no-eval
            isTrue = eval(target) === true;
          } catch (err) {
            console.error(
              `Below error occured while evaling cond target. target is evaluated by false.\n${err}`
            );
            isTrue = false;
          }

          // To do:: Fix below logic safely
          const conditionalAction = isTrue
            ? action.if.action.then
            : action.if.action.else;

          printActionDebuggingLog({
            action,
            cuiColorApplier: chalk.magentaBright,
            guiColor: 'magenta',
            extra: `'cond' is evaluated by ${isTrue}`,
          });

          if (conditionalAction) {
            nextAction = handleAction({
              actions: conditionalAction,
              queryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;

        default:
          log(LogType.error, 'Error: Not supported type, ' + type);
          break;
      }
    } catch (e) {
      log(LogType.error, e);
    }

    if (nextAction) {
      nextActions = [...nextActions, ...nextAction];
    }
  });

  // Theoretically, nextAction may have more than one script filter, but the case is not considered yet..

  return {
    nextActions,
    args: queryArgs,
  };
}

export { handleAction };
