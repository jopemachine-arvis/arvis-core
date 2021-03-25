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

const handleAction = (command, queryArgs, modifiers) => {
  const nextActions = handleModifiers(command.action, modifiers);

  switch (command.type.toLowerCase()) {
    // execute script
    case "script_filter":
    case "scriptfilter":
      const scriptWork = handleScriptFilter(command, queryArgs);
      return {
        nextActions,
        scriptWork,
      };
    // just execute next action
    case "keyword":
      return {
        nextActions
      };
    case "open":
      openFile(command.url);
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
