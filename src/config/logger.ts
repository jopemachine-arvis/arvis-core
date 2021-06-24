enum LogType {
  info,
  silly,
  debug,
  verbose,
  warn,
  error,
}

const defaultLogLevels: LogType[] = [LogType.debug, LogType.error, LogType.info];
let logLevels: LogType[] = defaultLogLevels;

/**
 * @param  {LogType[]} types
 * @description Print out the logs that are included in the "types".
 */
const setLogLevels = (types: LogType[]): void => {
  logLevels = types;
};

/**
 * @param  {LogType} type
 * @param  {any} message
 * @param  {any[]} optionalParams optionalParams of console.log, console.error
 */
const log = (type: LogType, message?: any, ...optionalParams: any[]): void => {
  if (type === LogType.error) {
    console.error(message, ...optionalParams);
  } else if (logLevels.includes(type)) {
    console.log(message, ...optionalParams);
  }
};

/**
 * @param  {Error} err
 */
const trace = (err: Error): void => {
  if (logLevels.includes(LogType.error)) {
    console.trace(err);
  }
};

export { LogType, setLogLevels, log, trace };
