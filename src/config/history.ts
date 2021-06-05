import Conf from 'conf';
import '../types';
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
  projectName: 'arvis-core'
});

/**
 * @summary
 */
export const getHistory = (): Log[] => {
  return conf.get('logs') as Log[];
};

/**
 * @param  {number} count
 */
export const setMaxLogCnt = (count: number): void => {
  conf.set('maxCount', count);
};

/**
 * @summary
 */
const getLogs = (): Log[] => {
  const logs = conf.get('logs') as any;
  const maxLogCnt = conf.get('maxCount') as number;

  // Considering the log to be pushed, add 1.
  const sIdx = logs.length - maxLogCnt + 1;
  if (sIdx > 0) logs.slice(sIdx);
  return logs;
};

/**
 * @param  {string} inputStr
 */
export const pushInputStrLog = (inputStr: string | undefined): void => {
  if (!inputStr || inputStr === '') return;

  const logs: Log[] = getLogs();

  logs.push({
    inputStr,
    type: 'query',
    timestamp: new Date().getTime(),
  });

  conf.set('logs', logs);
};

/**
 * @param  {Action} action
 */
export const pushActionLog = (action: Action): void => {
  const availableTypes: string[] = getActionTypesToLog();
  if (!availableTypes.includes(action.type)) return;
  const logs: Log[] = getLogs();

  logs.push({
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
 * @param  {string[]} types
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
