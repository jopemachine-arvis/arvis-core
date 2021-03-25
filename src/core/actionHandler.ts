import _ from 'lodash';
import { openFile, handleScriptFilter, copyToClipboard } from '../actions';

const handleModifiers = (nextActions, modifiers) => {
  if (!modifiers) modifiers = 'normal';
  if (nextActions && modifiers !== 'normal') {
    return _.filter(nextActions, action => {
      action.modifiers === modifiers;
    });
  }
  return nextActions;
};

const handleAction = async (command, queryArgs, modifiers) => {
  const nextActions = handleModifiers(command.action, modifiers);

  switch (command.type.toLowerCase()) {
    // execute script
    case "script_filter":
    case "scriptfilter":
      return {
        nextActions,
      };
    // just execute next action
    case "keyword":
      return {
        nextActions
      };
    case "open":
      await openFile(command.url);
      return {
      };
    case "clipboard":
      copyToClipboard(command.text);
      return {
      };
    case "":
      return {
      };
  }
};

export {
  handleAction
};
