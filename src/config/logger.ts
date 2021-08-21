export enum LogType {
  info,
  silly,
  debug,
  verbose,
  warn,
  error,
}

export const defaultLogLevels: LogType[] = [LogType.debug, LogType.error, LogType.info];

let logLevels: LogType[] = defaultLogLevels;

let logger: Console = console;

/**
 * Set custom console
 */
export const injectCustomConsole = (customConsole: any) => {
  logger = customConsole;
};

/**
 * Print out the logs that are included in the "types".
 * @param types
 */
export const setLogLevels = (types: LogType[]): void => {
  logLevels = types;
};

/**
 * @param type
 * @param message
 * @param optionalParams optionalParams of console.log, console.error
 */
export const log = (type: LogType, message?: any, ...optionalParams: any[]): void => {
  if (logLevels.includes(type)) {
    if (type === LogType.debug) {
      logger.log(`[Debug] ${message}`, ...optionalParams);
    } else if (type === LogType.error) {
      logger.error(message, ...optionalParams);
    } else if (type === LogType.warn) {
      logger.warn(message, ...optionalParams);
    } else {
      logger.log(message, ...optionalParams);
    }
  }
};

/**
 * @param err
 */
export const trace = (err: Error): void => {
  if (logLevels.includes(LogType.error)) {
    console.trace(err);
  }
};

