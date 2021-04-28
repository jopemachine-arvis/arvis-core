const argsExtract = (queryArgs: object, argToExtract: string) => {
  const result: object = { ...queryArgs };
  result[`${argToExtract}`] = queryArgs[argToExtract];
  result[`{query}`] = queryArgs[argToExtract];
  result[`$1`] = queryArgs[argToExtract];
  return result;
};

export {
  argsExtract
};