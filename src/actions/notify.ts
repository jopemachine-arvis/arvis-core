import { log, LogType } from '../config';

/**
 * @param  {string} title
 * @param  {string} text
 */
const notify = (_title: string, _text: string): void => {
  log(LogType.error, 'Not Implemented!');
};

export { notify };
