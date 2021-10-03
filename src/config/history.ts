import Conf from 'conf';
import _ from 'lodash';

let history: Log[] | undefined;
let maxLogCnt: number | undefined;

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
const discardOldLogs = (): void => {
  if (!history || !maxLogCnt) throw new Error('History API is not intialized!');

  // Considering the log to be pushed, add 1.
  const sIdx = history.length - maxLogCnt + 1;
  if (sIdx > 0) history = history.slice(sIdx);
};

/**
 * Initialize history object.
 * If history is already initialized, return history object.
 */
export const getHistory = (): Log[] => {
  if (history && maxLogCnt) {
    return history;
  }

  history = conf.get('logs') as Log[];
  maxLogCnt = conf.get('maxCount') as number;
  return history;
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
export const getLatestMatch = (str: string) => {
  if (str.trim() === '') return '';

  return _.find([...getHistory()].reverse(), historyLog =>
    historyLog.inputStr && historyLog.inputStr.startsWith(str)
  );
};

/**
 * @param bundleId
 * @param inputStr
 */
export const pushInputStrLog = (bundleId: string, inputStr: string | undefined): void => {
  if (!inputStr) return;
  if (!history || !maxLogCnt) throw new Error('History API is not intialized!');

  discardOldLogs();

  history!.push({
    bundleId,
    inputStr,
    type: 'query',
    timestamp: new Date().getTime(),
  });
};

/**
 * @param bundleId
 * @param action
 */
export const pushActionLog = (bundleId: string, action: Action): void => {
  const availableTypes: string[] = getActionTypesToLog();
  if (!availableTypes.includes(action.type)) return;
  if (!history || !maxLogCnt) throw new Error('History API is not intialized!');

  discardOldLogs();

  history!.push({
    bundleId,
    action,
    type: 'action',
    timestamp: new Date().getTime(),
  });
};

/**
 * @summary
 */
export const initHistory = (): void => {
  conf.set('logs', []);
};

/**
 * This function should be called before Arvis quit for saving history as file
 */
export const writeHistory = () => {
  if (history) {
    conf.set('logs', history);
  }
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
