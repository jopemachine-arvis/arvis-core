export const customActions = {
  'args': undefined,
  'clipboard': undefined,
  'cond': undefined,
  'keyword': undefined,
  'notification': undefined,
  'open': undefined,
  'script': undefined,
  'scriptfilter': undefined,
};

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
