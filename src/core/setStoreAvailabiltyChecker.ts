import { Store } from '../config/store';

/**
 * @param  {(available: boolean) => void} checkStoreIsAvailable
 * @summary Receive a callback function as a factor to set state when store is available and unavailable.
 *          For setting the spinner or something when the store is unavailable.
 */
const setStoreAvailabiltyChecker = (
  checkStoreIsAvailable: (available: boolean) => void
): void => {
  const store = Store.getInstance();
  store.checkStoreIsAvailable = checkStoreIsAvailable;
};

export { setStoreAvailabiltyChecker };
