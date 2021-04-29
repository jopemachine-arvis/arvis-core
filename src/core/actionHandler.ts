import _ from "lodash";
import { openFile, copyToClipboard, argsExtract } from "../actions";
import { handleScriptArgs } from "./argsHandler";
import { CommandManager } from "./commandManager";
import { handleModifiers } from "./modifierHandler";

// The actions arrangement is taken as a factor to branch according to cond or modifiers.
function handleAction(
  this: CommandManager,
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

  // There can still be more than one action, such as simultaneously performing clipboard and script_filter.
  _.map(actions, (action) => {
    switch (action.type.toLowerCase()) {
      // Execute script of script filter
      case "script_filter":
      case "scriptfilter":
        action = action as ScriptFilterAction;
        target = handleScriptArgs({ str: action.script_filter, queryArgs });
        nextAction = action;
        break;
      // Just execute next action
      case "keyword":
        action = action as KeywordAction;
        nextAction = action;
        break;
      // Open specific program, url..
      case "open":
        action = action as OpenAction;
        target = handleScriptArgs({ str: action.url, queryArgs });
        this.printDebuggingInfo && console.log("Open target: ", target);

        openFile(target);
        break;
      // Alarm
      case "alarm":
        break;
      // Copy text to clipboard
      case "clipboard":
        action = action as ClipboardAction;
        target = handleScriptArgs({ str: action.text, queryArgs });
        copyToClipboard(target);
        this.printDebuggingInfo && console.log("Copy target: ", target);

        break;
      // Extract query from args, vars and execute the action.
      case "args":
        action = action as ArgsAction;
        queryArgs = argsExtract(queryArgs, action.arg);
        this.printDebuggingInfo && console.log("Args to select: ", queryArgs);

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

        this.printDebuggingInfo && console.log("Condition script: ", target);
        const conditionalAction =
          // tslint:disable-next-line: no-eval
          eval(target) === true ? action.if.action.then : action.if.action.else;

        nextAction = this.handleAction({
          actions: conditionalAction,
          queryArgs,
          modifiersInput
        }).nextAction;
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
