/**
 * Sleep for a specified amount of time.
 * @param ms
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
