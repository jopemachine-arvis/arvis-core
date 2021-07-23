import _ from 'lodash';


/**
 * Only one modifier can be accepted for now
 * To do:: Expand this function to handle modifiers array (multiple modifiers) if needed
 * @param actions
 * @param modifiersInput
 * @returns Return filtered actions by pressed modifier
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
