export const getBundleId = (createdby: string, name: string) => {
  if (!createdby || !name || createdby === '' || name === '') {
    throw new Error(
      'Error: Necessary attribute not set on Extension setting file.'
    );
  }

  return `${createdby}.${name}`;
};

export const getNameFromBundleId = (bundleId: string) =>
  bundleId.split('.').slice(1).join('.');
