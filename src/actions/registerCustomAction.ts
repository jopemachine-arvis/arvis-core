export const customActions = {};

/**
 * @param  {string} type
 * @param  {(action:Action)=>void} callback
 * @return {void}
 * @description Register an unregistered action of a workflow
 *              Used in 'notification' type in GUI
 */
export const registerCustomAction = (
  type: string,
  callback: (action: Action) => void
): void => {
  customActions[type] = callback;
};
