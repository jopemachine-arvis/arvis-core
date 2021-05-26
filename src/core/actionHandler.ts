import chalk from 'chalk';
import _ from 'lodash';
import {
  argsExtract as argsExtractAction,
  copyToClipboard as copyToClipboardAction,
  customActions as customActions,
  handleScriptAction as handleScriptAction,
  openFile as openFileAction,
} from '../actions';
import { log, LogType } from '../config';
import { escapeBraket } from '../utils';
import { applyArgsToScript } from './argsHandler';
import { handleModifiers } from './modifierHandler';
import { extractScriptOnThisPlatform } from './scriptExtracter';
import { WorkManager } from './workManager';

/**
 * @summary
 */
const printActionDebuggingLog =
  (disabled: boolean) => (color: Function, type: string, text: string) => {
    if (disabled) return;
    if (!color || !type || !text) {
      log(LogType.error, `Error: [${type}] is not properly set up.`);
      return;
    }
    log(LogType.info, color(`[Action: ${type}] `), text);
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
    `'${typeName}' type should have '${requiredAttributes.join(' ')}'attribute`
  );
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
  let nextActions: Action[] | undefined = [];

  _.map(actions, (action) => {
    const type = action.type.toLowerCase();
    let logColor;

    // tslint:disable-next-line: no-string-literal
    nextActions = action['action'];

    if (customActions[action.type]) {
      customActions[action.type](action);
      return;
    }

    const printActionlog = () => {
      printActionDebuggingLog(!workManager.printActionType)(
        logColor,
        type,
        target
      );
    };

    try {
      switch (type) {
        case 'script':
          action = action as ScriptAction;
          if (!action.script) throwReqAttrNotExtErr(type, ['script']);

          const scriptStr = extractScriptOnThisPlatform(action.script);
          logColor = chalk.dim;
          target = applyArgsToScript({ scriptStr, queryArgs });

          printActionlog();
          handleScriptAction(action, queryArgs);
          break;

        // Scriptfilter cannot be processed here because it could be ran in a way other than 'Enter' event
        // Because the action is not processed here, so it passes action as nextAction, not action.action
        case 'scriptfilter':
          action = action as ScriptFilterAction;
          if (!action.script_filter)
            throwReqAttrNotExtErr(type, ['script_filter']);

          logColor = chalk.redBright;
          target = action.script_filter;
          nextActions = [action];

          // In the case of scriptfilter, you must press return to explicitly execute the action to leave below log.
          // Because otherwise, handleAction is not executed
          printActionlog();
          break;

        case 'keyword-waiting':
          action = action as KeywordAction;
          target = '';
          logColor = chalk.blackBright;

          printActionlog();

          if (nextActions) {
            nextActions = handleAction({
              actions: nextActions,
              queryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;

        // Just execute next action if it is trigger.
        // In case of keyword action, wait for next user input
        case 'keyword':
          action = action as KeywordAction;
          if (!action.command) throwReqAttrNotExtErr(type, ['command | title']);

          target = action.command || action.title;
          logColor = chalk.blackBright;

          printActionlog();

          if (workManager.getTopWork().type === 'keyword') {
            if (nextActions) {
              nextActions = handleAction({
                actions: nextActions,
                queryArgs,
                modifiersInput,
              }).nextActions;
            }
          } else {
            // Wait for next 'action' event
            nextActions = undefined;
          }
          break;

        // Just execute next action
        case 'hotkey':
          action = action as HotkeyAction;
          if (!action.hotkey) throwReqAttrNotExtErr(type, ['hotkey']);

          target = action.hotkey;
          logColor = chalk.whiteBright;

          printActionlog();

          if (nextActions) {
            nextActions = handleAction({
              actions: nextActions,
              queryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;

        // Open specific program, url..
        case 'open':
          action = action as OpenAction;
          if (!action.target) throwReqAttrNotExtErr(type, ['target']);

          logColor = chalk.blueBright;

          target = applyArgsToScript({ scriptStr: action.target, queryArgs });
          printActionlog();
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

          logColor = chalk.greenBright;

          target = applyArgsToScript({ scriptStr: action.text, queryArgs });
          printActionlog();
          copyToClipboardAction(target);
          break;

        // Extract query from args, vars and execute the action.
        case 'args':
          action = action as ArgsAction;
          if (!action.arg) throwReqAttrNotExtErr(type, ['arg']);

          logColor = chalk.blue;

          const argToExtract = escapeBraket(action.arg).trim();
          queryArgs = argsExtractAction(queryArgs, argToExtract);
          target = queryArgs;

          printActionlog();
          if (nextActions) {
            nextActions = handleAction({
              actions: nextActions,
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

          logColor = chalk.magentaBright;

          target = applyArgsToScript({
            scriptStr: action.if.cond,
            queryArgs,
            appendQuotes: true,
          });

          // To do:: Fix below logic safely
          const conditionalAction =
            // tslint:disable-next-line: no-eval
            eval(target) === true
              ? action.if.action.then
              : action.if.action.else;
          printActionlog();

          if (conditionalAction) {
            nextActions = handleAction({
              actions: conditionalAction,
              queryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;
      }
    } catch (e) {
      log(LogType.error, e);
    }
  });

  // Theoretically, nextAction may have more than one script filter, but the case is not considered yet..

  return {
    nextActions,
    args: queryArgs,
  };
}

export { handleAction };
