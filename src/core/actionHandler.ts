import chalk from 'chalk';
import execa, { ExecaError } from 'execa';
import _ from 'lodash';
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
import { WorkManager } from './workManager';

const scriptErrorHandler = (err: ExecaError) => {
  if (err.timedOut) {
    console.error(`Script timeout!`);
  } else if (err.isCanceled) {
    console.error(`Script canceled`);
  } else {
    console.error(`Script Error\n${err}`);
  }
};

const printDebuggingLog = (disabled: boolean) => (
  color: Function,
  type: string,
  text: string
) => {
  if (!color || !type || !text) {
    console.error(`Error: [${type}] is not properly set up.`);
    return;
  }
  !disabled && console.log(color(`[Action: ${type}] `), text);
};

// The actions arrangement is taken as a factor to branch according to cond or modifiers.
function handleAction(
  this: WorkManager,
  {
    actions,
    queryArgs,
    modifiersInput,
  }: {
    actions: Action[];
    queryArgs: object;
    modifiersInput: ModifierInput;
  }
) {
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
      printDebuggingLog(!this.printActionType)(logColor, type, target);
    };

    try {
      switch (type) {
        case 'script':
          action = action as ScriptAction;
          logColor = chalk.yellowBright;
          target = applyArgsToScript({ str: action.script, queryArgs });
          const scriptWork = execute(this.getTopWork().bundleId, target, {
            all: true,
          });
          log();

          scriptWork
            .then((result: execa.ExecaReturnValue<string>) => {
              if (this.printWorkflowOutput) {
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
          log();
          break;

        // Just execute next action
        case 'keyword':
          action = action as KeywordAction;
          target = action.command;
          logColor = chalk.blackBright;
          log();

          nextActions = this.handleAction({
            actions: nextActions,
            queryArgs,
            modifiersInput,
          }).nextActions;
          break;

        // Just execute next action
        case 'hotkey':
          action = action as HotkeyAction;
          target = action.hotkey;
          logColor = chalk.whiteBright;
          log();

          nextActions = this.handleAction({
            actions: nextActions,
            queryArgs,
            modifiersInput,
          }).nextActions;
          break;

        // Open specific program, url..
        case 'open':
          action = action as OpenAction;
          logColor = chalk.blueBright;
          target = applyArgsToScript({ str: action.target, queryArgs });

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
          target = applyArgsToScript({ str: action.text, queryArgs });
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
          nextActions = this.handleAction({
            actions: nextActions,
            queryArgs,
            modifiersInput,
          }).nextActions;
          break;

        // Run 'cond' as eval to determine if true.
        // And run 'then' actions if cond is true, else run 'else' actions.
        case 'cond':
          action = action as CondAction;
          logColor = chalk.magentaBright;
          target = applyArgsToScript({
            str: action.if.cond,
            queryArgs,
            appendQuotes: true,
          });

          const conditionalAction =
            // tslint:disable-next-line: no-eval
            eval(target) === true
              ? action.if.action.then
              : action.if.action.else;
          log();

          nextActions = this.handleAction({
            actions: conditionalAction,
            queryArgs,
            modifiersInput,
          }).nextActions;
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
