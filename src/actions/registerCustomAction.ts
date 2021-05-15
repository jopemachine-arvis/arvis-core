export const customActions = {
  'scriptfilter': undefined,
  'keyword': undefined,
  'open': undefined,
  'notification': undefined,
  'clipboard': undefined,
  'args': undefined,
  'cond': undefined,
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
) => {
  customActions[type] = callback;
};
