/**
 * @param ms
 * @returns {Promise<void>}
 * @summary Sleep for a specified amount of time.
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
