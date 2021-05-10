/**
 * @param  {number} ms
 * @return {Promise<void>}
 * @summary Sleep for a specified amount of time.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export {
  sleep
};
