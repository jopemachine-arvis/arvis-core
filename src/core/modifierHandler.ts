import _ from 'lodash';
import '../types';

export const handleModifiers = (
  actions: Action[],
  modifiersInput: ModifierInput
) => {
  // Only one modifier can be accepted for now
  // Expand this function to handle modifiers array if needed

  // let pressedModifiers: string[] = _.filter(
  //   Object.keys(modifiersInput),
  //   (modifier) => modifiersInput[modifier] === true
  // );

  let pressedModifier: string = _.filter(
    Object.keys(modifiersInput),
    (modifier) => modifiersInput[modifier] === true
  )[0];

  if (!pressedModifier) pressedModifier = 'normal';

  if (actions) {
    return _.filter(actions, (action) => action.modifiers === pressedModifier);
  }

  return actions;
};
