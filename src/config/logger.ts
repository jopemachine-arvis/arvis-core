enum LogType {
  info,
  silly,
  debug,
  verbose,
  warn,
  error,
}

const defaultLogLevels = [LogType.debug];
let logLevels: LogType[] = defaultLogLevels;

/**
 * @param  {LogType[]} types
 */
const setLogLevels = (types: LogType[]) => {
  logLevels = types;
};

/**
 * @param  {LogType} type
 * @param  {any} message
 * @param  {any[]} ...optionalParams
 */
const log = (type: LogType, message: any, ...optionalParams: any[]) => {
  if (type === LogType.error) {
    console.error(message, optionalParams);
  } else if (logLevels.includes(type)) {
    console.log(message, optionalParams);
  }
};

export { LogType, setLogLevels, log };
