import chalk from 'chalk';
import _ from 'lodash';
import {
  argsExtract,
  copyToClipboard,
  customActions,
  openFile,
} from '../actions';
import { escapeBraket } from '../utils';
import { handleScriptArgs } from './argsHandler';
import { handleModifiers } from './modifierHandler';
import { execute } from './scriptExecutor';
import { WorkManager } from './workManager';

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

  const log = (color: Function, type: string, text: string) => {
    if (!color || !type || !text) {
      console.error(`Error: [${type}] is not properly set up.`);
      return;
    }
    this.printActionType && console.log(color(`[${type}] `), text);
  };

  _.map(actions, (action) => {
    const type = action.type.toLowerCase();
    let logColor;

    // tslint:disable-next-line: no-string-literal
    nextActions = action['action'];

    if (customActions[action.type]) {
      customActions[action.type](action);
      return;
    }

    try {
      switch (type) {
        case 'script':
          action = action as ScriptAction;
          logColor = chalk.yellowBright;
          target = action.script;
          execute(this.getTopWork().bundleId, target);
          break;

        // Scriptfilter cannot be processed here because it could be ran in a way other than 'Enter' event
        // Because the action is not processed here, so it passes action as nextAction, not action.action
        case 'scriptfilter':
          action = action as ScriptFilterAction;
          logColor = chalk.redBright;
          target = action.script_filter;
          nextActions = [action];
          break;

        // Just execute next action
        case 'keyword':
          action = action as KeywordAction;
          target = action.command;
          logColor = chalk.blackBright;

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
          target = handleScriptArgs({ str: action.target, queryArgs });

          openFile(target);
          break;

        // Notification (Not implemented on here)
        case 'notification':
          action = action as NotiAction;
          log(chalk.whiteBright, type, action.title);
          break;

        // Copy text to clipboard
        case 'clipboard':
          action = action as ClipboardAction;
          logColor = chalk.greenBright;
          target = handleScriptArgs({ str: action.text, queryArgs });
          copyToClipboard(target);
          break;

        // Extract query from args, vars and execute the action.
        case 'args':
          action = action as ArgsAction;
          logColor = chalk.blue;

          const argToExtract = escapeBraket(action.arg).trim();
          queryArgs = argsExtract(queryArgs, argToExtract);
          target = queryArgs;

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
          target = handleScriptArgs({
            str: action.if.cond,
            queryArgs,
            appendQuotes: true,
          });

          const conditionalAction =
            // tslint:disable-next-line: no-eval
            eval(target) === true
              ? action.if.action.then
              : action.if.action.else;

          nextActions = this.handleAction({
            actions: conditionalAction,
            queryArgs,
            modifiersInput,
          }).nextActions;
          break;
      }
    } catch (e) {
      throw new Error(`[${type}] occured error!\n, target: ${target}`);
    }

    log(logColor, type, target);
  });

  // To do::
  // Theoretically, nextAction may have more than one script filter, but the case is not considered yet..

  return {
    nextActions,
    args: queryArgs,
  };
}

export { handleAction };
