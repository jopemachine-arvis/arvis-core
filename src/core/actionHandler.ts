import _ from "lodash";
import { openFile, copyToClipboard } from "../actions";
import { handleScriptArgs } from "./argsHandler";

const handleModifiers = (actions, modifiersInput: ModifierInput) => {
  if (!modifiersInput) modifiersInput = { 'normal': true };

  const modifiers = _.filter(
    Object.keys(modifiersInput),
    (modifier) => modifiersInput[modifier] === true
  );

  if (actions) {
    return _.filter(actions, (action) => {
      let included = true;
      for (const modifier of modifiers) {
        if (!action.modifiers.includes(modifier)) {
          included = false;
        }
      }
      return included;
    });
  }
  return actions;
};

// The actions arrangement is taken as a factor to branch according to cond or modifiers.
const handleAction = async (actions, queryArgs, modifiersInput) => {
  actions = handleModifiers(actions, modifiersInput);
  let nextAction: any = null;
  let target;

  // There can still be more than one action, such as simultaneously performing clipboard and script_filter.
  await Promise.all(
    _.map(actions, async (action) => {
      switch (action.type.toLowerCase()) {
        // execute script
        case "script_filter":
        case "scriptfilter":
          target = handleScriptArgs(action.script_filter, queryArgs);
          nextAction = action.action;
          break;
        // just execute next action
        case "keyword":
          nextAction = action.action;
        case "open":
          target = handleScriptArgs(action.url, queryArgs);
          await openFile(target);
          break;
        case "clipboard":
          target = handleScriptArgs(action.text, queryArgs);
          copyToClipboard(target);
          break;
        case "":
          break;
      }
    })
  );

  return {
    nextAction
  };
};

export { handleAction };
