import Conf from 'conf';
import _ from 'lodash';

import { log, LogType } from './logger';

const schema = {
  logs: {
    type: 'array',
    default: [],
  },
  maxCount: {
    type: 'number',
    default: 500,
  },
  actionTypesToLog: {
    type: 'array',
    default: ['script', 'clipboard', 'open'],
  },
} as const;

const conf = new Conf({
  schema,
  clearInvalidConfig: true,
  configName: 'arvis-history',
  projectName: 'arvis-core',
});

/**
 * @summary
 */
const discardOldAndGetLogs = (): Log[] => {
  let logs = conf.get('logs') as Log[];
  const maxLogCnt = conf.get('maxCount') as number;

  // Considering the log to be pushed, add 1.
  const sIdx = logs.length - maxLogCnt + 1;
  if (sIdx > 0) logs = logs.slice(sIdx);
  return logs;
};

/**
 * @summary
 */
export const getHistory = (): Log[] => {
  return conf.get('logs') as Log[];
};

/**
 * @param count
 */
export const setMaxLogCnt = (count: number): void => {
  conf.set('maxCount', count);
};

/**
 * @param str
 */
export const getBestMatch = (str: string) => {
  if (str.trim() === '') return '';

  const history = getHistory().reverse();

  return _.find(history, historyLog =>
    historyLog.inputStr && historyLog.inputStr.startsWith(str)
  );
};

/**
 * @param bundleId
 * @param inputStr
 */
export const pushInputStrLog = (bundleId: string, inputStr: string | undefined): void => {
  if (!inputStr || inputStr === '') return;

  const logs: Log[] = discardOldAndGetLogs();

  logs.push({
    bundleId,
    inputStr,
    type: 'query',
    timestamp: new Date().getTime(),
  });

  conf.set('logs', logs);
};

/**
 * @param bundleId
 * @param action
 */
export const pushActionLog = (bundleId: string, action: Action): void => {
  const availableTypes: string[] = getActionTypesToLog();
  if (!availableTypes.includes(action.type)) return;
  const logs: Log[] = discardOldAndGetLogs();

  logs.push({
    bundleId,
    action,
    type: 'action',
    timestamp: new Date().getTime(),
  });

  conf.set('logs', logs);

  log(LogType.silly, 'Current logs', logs);
};

/**
 * @summary
 */
export const initHistory = (): void => {
  conf.set('logs', []);
};

/**
 * @param types
 */
export const setActionTypesToLog = (types: string[]): void => {
  conf.set('actionTypesToLog', types);
};

/**
 * @summary
 */
export const getActionTypesToLog = (): string[] => {
  return conf.get('actionTypesToLog') as string[];
};

/**
 * @summary
 */
export const getHistoryFilePath = (): string => {
  return conf.path;
};
