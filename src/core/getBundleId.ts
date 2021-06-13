export const getBundleId = (creator: string, name: string) => {
  if (!creator || !name || creator === '' || name === '') {
    throw new Error(
      'Error: Necessary attribute not set on Extension setting file.'
    );
  }

  return `${creator}.${name}`;
};

export const getNameFromBundleId = (bundleId: string) =>
  bundleId.split('.').slice(1).join('.');
