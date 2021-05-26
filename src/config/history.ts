import Conf from 'conf';
import '../types';

const schema = {
  logs: {
    type: 'array',
    default: [],
  },
  maxCount: {
    type: 'number',
    default: 100,
  },
} as const;

const conf = new Conf({
  schema,
  clearInvalidConfig: true,
  configName: 'arvis-history',
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
export const pushInputStrLog = (inputStr: string): void => {
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
  const logs: Log[] = getLogs();

  logs.push({
    action,
    type: 'action',
    timestamp: new Date().getTime(),
  });

  conf.set('logs', logs);
  console.log('Print!!!!!!!!!', logs)
};

/**
 * @summary
 */
export const initHistory = (): void => {
  conf.set('logs', []);
};
