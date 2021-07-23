export const customActions = {};

/**
 * Register an unregistered action of a workflow
 * Used in 'notification' type in GUI
 * @param type
 * @param callback
 */
export const registerCustomAction = (
  type: string,
  callback: (action: Action) => void
): void => {
  customActions[type] = callback;
};
