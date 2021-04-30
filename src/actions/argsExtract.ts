// Extract the desired string from queryArgs, and assign it to query and $1.
const argsExtract = (queryArgs: object, argToExtract: string) => {
  const result: object = { ...queryArgs };

  const targetString = queryArgs[argToExtract];

  result[`${argToExtract}`] = targetString;
  result[`{query}`] = targetString;
  result[`$1`] = targetString;

  return result;
};

export {
  argsExtract
};