export const customActions = {
  'scriptfilter': undefined,
  'keyword': undefined,
  'open': undefined,
  'notification': undefined,
  'clipboard': undefined,
  'args': undefined,
  'cond': undefined,
};

export const registerCustomAction = (
  type: string,
  callback: (action: Action) => void
) => {
  customActions[type] = callback;
};
