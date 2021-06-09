import parseJson from 'parse-json';

/**
 * @summary Return all json candidates from string
 * @param  {string} str
 * @return {any[]} All json candidates
 * @description Ref: https://stackoverflow.com/questions/10574520/extract-json-from-text
 */
export default function extractJSON(str: string): any[] {
  let firstOpen = 0;
  let firstClose;
  let candidate;
  firstOpen = str.indexOf('{', firstOpen + 1);
  const jsons: any[] = [];

  do {
    firstClose = str.lastIndexOf('}');
    if (firstClose <= firstOpen) {
      return jsons;
    }
    do {
      candidate = str.substring(firstOpen, firstClose + 1);
      try {
        const res = parseJson(candidate);
        jsons.push(res);
      } catch (e) {
        // console.log('...failed');
      }
      firstClose = str.substr(0, firstClose).lastIndexOf('}');
    } while (firstClose > firstOpen);
    firstOpen = str.indexOf('{', firstOpen + 1);
  } while (firstOpen !== -1);

  return jsons;
}
