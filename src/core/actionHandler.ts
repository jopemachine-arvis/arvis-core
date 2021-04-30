import _ from "lodash";
import {
  openFile,
  copyToClipboard,
  argsExtract,
  customActions,
} from "../actions";
import { handleScriptArgs } from "./argsHandler";
import { WorkManager } from "./workManager";
import { handleModifiers } from "./modifierHandler";
import { execute } from './scriptExecutor';
import chalk from 'chalk';

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
    if (!color || !type || !text) return;
    this.printDebuggingInfo && console.log(color(`[${type}] `), text);
  };

  // There can still be more than one action, such as simultaneously performing clipboard and script_filter.
  _.map(actions, (action) => {

    const type = action.type.toLowerCase();
    let logColor;

    // tslint:disable-next-line: no-string-literal
    nextActions = action['action'];

    if (customActions[action.type]) {
      customActions[action.type](action);
      return;
    }

    switch (type) {

      case "script":
        action = action as ScriptAction;
        target = action.script;
        logColor = chalk.yellowBright;
        execute(this.getTopCommand().bundleId, target);
        break;

      // Scriptfilter cannot be processed here because it could be ran in a way other than 'Enter' event
      // Because the action is not processed here, so it passes action as nextAction, not action.action
      case "scriptfilter":
        action = action as ScriptFilterAction;
        target = action.script_filter;
        nextActions = [action];
        logColor = chalk.redBright;
        break;

      // Just execute next action
      case "keyword":
        action = action as KeywordAction;
        target = action.command;

        nextActions = this.handleAction({
          actions: nextActions,
          queryArgs,
          modifiersInput,
        }).nextActions;
        logColor = chalk.blackBright;
        break;

      // Open specific program, url..
      case "open":
        action = action as OpenAction;
        target = handleScriptArgs({ str: action.target, queryArgs });
        logColor = chalk.blueBright;

        openFile(target);
        break;

      // Notification (Not implemented on here)
      case "notification":
        action = action as NotiAction;
        log(chalk.whiteBright, type, action.title);
        break;

      // Copy text to clipboard
      case "clipboard":
        action = action as ClipboardAction;
        target = handleScriptArgs({ str: action.text, queryArgs });
        copyToClipboard(target);
        logColor = chalk.greenBright;
        break;

      // Extract query from args, vars and execute the action.
      case "args":
        action = action as ArgsAction;
        queryArgs = argsExtract(queryArgs, action.arg);

        nextActions = this.handleAction({
          actions: nextActions,
          queryArgs,
          modifiersInput,
        }).nextActions;
        break;

      // Run 'cond' as eval to determine if true.
      // And run 'then' actions if cond is true, else run 'else' actions.
      case "cond":
        action = action as CondAction;
        target = handleScriptArgs({
          str: action.if.cond,
          queryArgs,
          appendQuotes: true,
        });

        logColor = chalk.magentaBright;

        try {
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
        } catch (err) {
          throw new Error(`Condition is not valid, condition: ${target}`);
        }
        break;
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
