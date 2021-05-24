enum LogType {
  info,
  silly,
  debug,
  verbose,
  warn,
  error,
}

const defaultLogLevels = [LogType.debug, LogType.error, LogType.info];
let logLevels: LogType[] = defaultLogLevels;

/**
 * @param  {LogType[]} types
 * @description Print out the logs that are included in the "types".
 */
const setLogLevels = (types: LogType[]) => {
  logLevels = types;
};

/**
 * @param  {LogType} type
 * @param  {any} message
 * @param  {any[]} optionalParams optionalParams of console.log, console.error
 */
const log = (type: LogType, message?: any, ...optionalParams: any[]) => {
  if (type === LogType.error) {
    console.error(message, optionalParams);
  } else if (logLevels.includes(type)) {
    console.log(message, optionalParams);
  }
};

export { LogType, setLogLevels, log };
