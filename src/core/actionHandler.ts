import chalk from 'chalk';
import _ from 'lodash';
import execa, { ExecaError } from '../../execa';
import {
  argsExtract,
  copyToClipboard,
  customActions,
  openFile,
} from '../actions';
import { escapeBraket } from '../utils';
import { applyArgsToScript } from './argsHandler';
import { handleModifiers } from './modifierHandler';
import { execute } from './scriptExecutor';
import { extractScriptOnThisPlatform } from './scriptExtracter';
import { WorkManager } from './workManager';

/**
 * @param  {ExecaError} err
 */
const scriptErrorHandler = (err: ExecaError) => {
  if (err.timedOut) {
    console.error(`Script timeout!`);
  } else if (err.isCanceled) {
    console.error(`Script canceled`);
  } else {
    console.error(`Script Error\n${err}`);
  }
};

/**
 * @summary
 */
const printDebuggingLog =
  (disabled: boolean) => (color: Function, type: string, text: string) => {
    if (disabled) return;
    if (!color || !type || !text) {
      console.error(`Error: [${type}] is not properly set up.`);
      return;
    }
    console.log(color(`[Action: ${type}] `), text);
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
}) {
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

    const log = () => {
      printDebuggingLog(!workManager.printActionType)(logColor, type, target);
    };

    try {
      switch (type) {
        case 'script':
          action = action as ScriptAction;
          logColor = chalk.yellowBright;
          const scriptStr = extractScriptOnThisPlatform(action.script);
          target = applyArgsToScript({ scriptStr, queryArgs });
          const scriptWork = execute({
            bundleId: workManager.getTopWork().bundleId,
            scriptStr: target,
            options: { all: true },
          });
          log();

          scriptWork
            .then((result: execa.ExecaReturnValue<string>) => {
              if (workManager.printWorkflowOutput) {
                console.log(`[Output]\n\n ${result.all}`);
              }
            })
            .catch(scriptErrorHandler);
          break;

        // Scriptfilter cannot be processed here because it could be ran in a way other than 'Enter' event
        // Because the action is not processed here, so it passes action as nextAction, not action.action
        case 'scriptfilter':
          action = action as ScriptFilterAction;
          logColor = chalk.redBright;
          target = action.script_filter;
          nextActions = [action];
          // In the case of scriptfilter, you must press return to explicitly execute the action to leave below log.
          // Because otherwise, handleAction is not executed
          log();
          break;

        // Just execute next action
        case 'keyword':
          action = action as KeywordAction;
          target = action.command;
          logColor = chalk.blackBright;
          log();

          if (nextActions) {
            nextActions = handleAction({
              actions: nextActions,
              queryArgs,
              modifiersInput,
            }).nextActions;
          }
          break;

        // Just execute next action
        case 'hotkey':
          action = action as HotkeyAction;
          target = action.hotkey;
          logColor = chalk.whiteBright;
          log();

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
          logColor = chalk.blueBright;
          target = applyArgsToScript({ scriptStr: action.target, queryArgs });

          openFile(target);
          log();
          break;

        // Notification (Not implemented on here)
        case 'notification':
          action = action as NotiAction;
          break;

        // Copy text to clipboard
        case 'clipboard':
          action = action as ClipboardAction;
          logColor = chalk.greenBright;
          target = applyArgsToScript({ scriptStr: action.text, queryArgs });
          copyToClipboard(target);
          log();
          break;

        // Extract query from args, vars and execute the action.
        case 'args':
          action = action as ArgsAction;
          logColor = chalk.blue;

          const argToExtract = escapeBraket(action.arg).trim();
          queryArgs = argsExtract(queryArgs, argToExtract);
          target = queryArgs;

          log();
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
          logColor = chalk.magentaBright;
          target = applyArgsToScript({
            scriptStr: action.if.cond,
            queryArgs,
            appendQuotes: true,
          });

          const conditionalAction =
            // tslint:disable-next-line: no-eval
            eval(target) === true
              ? action.if.action.then
              : action.if.action.else;
          log();

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
      throw new Error(`[Action: ${type}] occured error!\n, target: ${target}`);
    }
  });

  // Theoretically, nextAction may have more than one script filter, but the case is not considered yet..

  return {
    nextActions,
    args: queryArgs,
  };
}

export { handleAction };
