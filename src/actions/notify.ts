import { log, LogType } from '../config';

/**
 * @param  {string} title
 * @param  {string} text
 */
const notify = (_title: string, _text: string) => {
  log(LogType.error, 'Not Implemented!');
};

export { notify };
