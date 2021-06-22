const {
  applyArgsToScript,
  extractArgsFromPluginItem,
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
} = require('../../../dist/core/argsHandler');

describe('argsExtract test', () => {
  test('applyArgsToScript with no appendQuote test', () => {
    const scriptStr = 'node {query}';
    const queryArgs = {
      '{query}': 'abc',
    };
    const appendQuotes = false;

    const result = applyArgsToScript({ scriptStr, queryArgs, appendQuotes });

    expect(result).toStrictEqual('node abc');
  });

  test('applyArgsToScript with appendQuote test', () => {
    const scriptStr = 'node {query}';
    const queryArgs = {
      '{query}': 'abc',
    };
    const appendQuotes = true;

    const result = applyArgsToScript({ scriptStr, queryArgs, appendQuotes });

    expect(result).toStrictEqual(`node "abc"`);
  });

  test('extractArgsFromPluginItem test', () => {
    const item = {
      type: 'keyword',
      bundleId: 'bundleId',
      title: 'some title',
      arg: 'some arg',
    };

    const result = extractArgsFromPluginItem(item);

    const expected = {
      '{query}': 'some arg',
      $1: 'some arg',
    };

    expect(result).toStrictEqual(expected);
  });

  test('extractArgsFromQuery test', () => {
    const querys = ['abc.js', 'some_arg=arg'];
    const result = extractArgsFromQuery(querys);
    const expected = {
      '{query}': 'abc.js some_arg=arg',
      $1: 'abc.js',
      $2: 'some_arg=arg',
    };
    expect(result).toStrictEqual(expected);
  });

  test('extractArgsFromScriptFilterItem test with object arg', () => {
    const item = {
      title: 'some_title',
      subtitle: 'some_subtitle',
      arg: {
        arg1: 'arg1'
      },
      variables: {
        var1: 'var1',
      }
    };

    const vars = {
      var2: 'var2'
    };

    const result = extractArgsFromScriptFilterItem(item, vars);

    const expected = {
      arg1: 'arg1',
      '{var:var1}': 'var1',
      '{var:var2}': 'var2'
    };

    expect(result).toStrictEqual(expected);
  });

  test('extractArgsFromScriptFilterItem test with string arg', () => {
    const item = {
      title: 'some_title',
      subtitle: 'some_subtitle',
      arg: 'abcdefg',
      variables: {
        var1: 'var1',
      }
    };

    const vars = {
      var2: 'var2'
    };

    const result = extractArgsFromScriptFilterItem(item, vars);

    const expected = {
      '{query}': 'abcdefg',
      $1: 'abcdefg',
      '{var:var1}': 'var1',
      '{var:var2}': 'var2'
    };

    expect(result).toStrictEqual(expected);
  });
});
