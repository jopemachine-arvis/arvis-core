import _ from "lodash";
import "../types";

export const handleModifiers = (actions: Action[], modifiersInput: ModifierInput) => {
  if (!modifiersInput) modifiersInput = { normal: true };

  const modifiers = _.filter(
    Object.keys(modifiersInput),
    (modifier) => modifiersInput[modifier] === true
  );

  if (actions) {
    return _.filter(actions, (action) => {
      let included = true;
      for (const modifier of modifiers) {
        if (action.modifiers && !action.modifiers.includes(modifier)) {
          included = false;
        }
      }
      return included;
    });
  }
  return actions;
};
