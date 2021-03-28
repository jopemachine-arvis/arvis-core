import _ from "lodash";
import { openFile, copyToClipboard, argsExtract } from "../actions";
import { handleScriptArgs } from "./argsHandler";
import { handleModifiers } from './modifierHandler';

// The actions arrangement is taken as a factor to branch according to cond or modifiers.
const handleAction = (
  actions: Action[],
  queryArgs: object,
  modifiersInput: ModifierInput
) => {
  actions = handleModifiers(actions, modifiersInput);
  let target;
  let nextAction: any = null;

  // There can still be more than one action, such as simultaneously performing clipboard and script_filter.
  _.map(actions, (action) => {
    switch (action.type.toLowerCase()) {
      // execute script
      case "script_filter":
      case "scriptfilter":
        action = action as ScriptFilterAction;
        target = handleScriptArgs(action.script_filter, queryArgs);
        nextAction = action.action;
        break;
      // just execute next action
      case "keyword":
        action = action as KeywordAction;
        nextAction = action.action;
        break;
      case "open":
        action = action as OpenAction;
        target = handleScriptArgs(action.url, queryArgs);
        openFile(target);
        break;
      case "clipboard":
        action = action as ClipboardAction;
        target = handleScriptArgs(action.text, queryArgs);
        copyToClipboard(target);
        break;
      case "args":
        action = action as ArgsAction;
        queryArgs = argsExtract(queryArgs, action.arg);
        handleAction(action.action, queryArgs, modifiersInput);
        break;
    }
  });

  return {
    nextAction,
  };
};

export { handleAction };
