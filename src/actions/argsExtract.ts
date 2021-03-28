const argsExtract = (queryArgs: object, argToExtract: string) => {
  const result: object = {};
  result[`${argToExtract}`] = queryArgs[argToExtract];
  return result;
};

export {
  argsExtract
};