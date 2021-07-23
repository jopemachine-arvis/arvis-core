import { Store } from '../config/store';

/**
 * Receive a callback function as a factor to set state when store is available and unavailable.
 * For setting the spinner or something when the store is unavailable.
 * @param checkStoreIsAvailable
 */
export const setStoreAvailabiltyChecker = (
  checkStoreIsAvailable: (available: boolean) => void
): void => {
  const store = Store.getInstance();
  store.checkStoreIsAvailable = checkStoreIsAvailable;
};
