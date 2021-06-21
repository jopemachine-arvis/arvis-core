const { argsExtract } = require('../../../dist/actions/argsExtract');

describe('argsExtract test', () => {
  test('Extract query', () => {
    const input = {
      '{query}': 'abc',
      $1: 'abc',
    };
    const result = argsExtract(input, '{query}');

    const expected = {
      '{query}': 'abc',
      $1: 'abc',
    };

    expect(result).toStrictEqual(expected);
  });

  test('Extract $1', () => {
    const input = {
      '{query}': 'abc',
      $1: 'abc',
    };
    const result = argsExtract(input, '$1');

    const expected = {
      '{query}': 'abc',
      $1: 'abc',
    };

    expect(result).toStrictEqual(expected);
  });

  test('Extract variables 1', () => {
    const input = {
      '{query}': 'abc',
      $1: 'abc',
      '{var:a}': 'a',
      '{var:b}': 'b',
    };
    const result = argsExtract(input, '{var:a}{var:b}');

    const expected = {
      '{query}': 'ab',
      $1: 'abc',
      '{var:a}': 'a',
      '{var:b}': 'b',
    };

    expect(result).toStrictEqual(expected);
  });

  test('Extract variables 2', () => {
    const input = {
      '{query}': 'abc',
      $1: 'abc',
      '{var:a}': 'a',
      '{var:b}': 'b',
    };
    const result = argsExtract(input, '{var:a} {var:b}');

    const expected = {
      '{query}': 'a b',
      $1: 'abc',
      '{var:a}': 'a',
      '{var:b}': 'b',
    };

    expect(result).toStrictEqual(expected);
  });
});
