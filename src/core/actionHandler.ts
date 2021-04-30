import _ from "lodash";
import {
  openFile,
  copyToClipboard,
  argsExtract,
  customActions,
  scriptFilterExcute
} from "../actions";
import { extractArgs, handleScriptArgs } from "./argsHandler";
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
  let nextAction: Action | null = null;

  const log = (color: Function, type: string, text: string) => {
    this.printDebuggingInfo && console.log(color(`[${type}] `), text);
  };

  // There can still be more than one action, such as simultaneously performing clipboard and script_filter.
  _.map(actions, (action) => {

    if (customActions[action.type]) {
      customActions[action.type](action);
      return;
    }

    const type = action.type.toLowerCase();
    switch (type) {
      case "script":
        action = action as ScriptAction;
        target = action.script;
        log(chalk.yellowBright, type, target);
        execute(this.getTopCommand().bundleId, target);
        break;
      // Scriptfilter cannot be processed here because it could be ran in a way other than 'Enter' event
      case "scriptfilter":
        action = action as ScriptFilterAction;
        target = action.script_filter;
        nextAction = action;
        log(chalk.bgRedBright, type, target);
        break;
      // Just execute next action
      case "keyword":
        action = action as KeywordAction;
        target = action.command;

        nextAction = this.handleAction({
          actions: action.action,
          queryArgs,
          modifiersInput,
        }).nextAction;
        log(chalk.blackBright, type, target);
        break;
      // Open specific program, url..
      case "open":
        action = action as OpenAction;
        target = handleScriptArgs({ str: action.target, queryArgs });
        log(chalk.blueBright, type, target);

        openFile(target);
        break;
      // Notification
      case "notification":
        // Not implemented
        break;
      // Copy text to clipboard
      case "clipboard":
        action = action as ClipboardAction;
        target = handleScriptArgs({ str: action.text, queryArgs });
        copyToClipboard(target);
        log(chalk.greenBright, type, target);

        break;
      // Extract query from args, vars and execute the action.
      case "args":
        action = action as ArgsAction;
        queryArgs = argsExtract(queryArgs, action.arg);
        log(chalk.cyanBright, type, target);

        nextAction = this.handleAction({
          actions: action.action,
          queryArgs,
          modifiersInput,
        }).nextAction;
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

        log(chalk.magentaBright, type, target);

        try {
          const conditionalAction =
            // tslint:disable-next-line: no-eval
            eval(target) === true
              ? action.if.action.then
              : action.if.action.else;

          nextAction = this.handleAction({
            actions: conditionalAction,
            queryArgs,
            modifiersInput,
          }).nextAction;
        } catch (err) {
          throw new Error(`Condition is not valid, condition: ${target}`);
        }
        break;
    }
  });

  // To do::
  // Theoretically, nextAction may have more than one script filter, but the case is not considered yet..

  return {
    nextAction,
    args: queryArgs,
  };
}

export { handleAction };
