import _ from 'lodash';


/**
 * @param  {Action[]} actions
 * @param  {Readonly<ModifierInput>} modifiersInput
 * @return {Action[]} filtered actions by pressed modifier
 * @description Only one modifier can be accepted for now
 *              To do:: Expand this function to handle modifiers array (multiple modifiers) if needed
 */
export const handleModifiers = (
  actions: Action[],
  modifiersInput: Readonly<ModifierInput>
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
