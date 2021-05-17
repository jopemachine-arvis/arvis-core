import _ from 'lodash';
import '../types';

/**
 * @param  {Action[]} actions
 * @param  {ModifierInput} modifiersInput
 * @return {Action[]} modifiers applied actions
 * @description Only one modifier can be accepted for now
 *              Expand this function to handle modifiers array if needed
 */
export const handleModifiers = (
  actions: Action[],
  modifiersInput: ModifierInput
): Action[] => {
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
    return _.filter(actions, (action) => {
      return (
        action.modifiers === pressedModifier ||
        (!action.modifiers && pressedModifier === 'normal')
      );
    });
  }

  return actions;
};
