const {
  applyArgs,
  extractArgsFromPluginItem,
  extractArgsFromQuery,
  extractArgsFromScriptFilterItem,
} = require('../../../dist/core/argsHandler');

describe('argsExtract test', () => {
  test('applyArgs with no appendQuote test', () => {
    const scriptStr = 'node {query}';
    const queryArgs = {
      '{query}': 'abc',
    };
    const appendQuotes = false;

    const result = applyArgs({ str: scriptStr, queryArgs, appendQuotes });

    expect(result).toStrictEqual('node abc');
  });

  test('applyArgs with appendQuote test', () => {
    const scriptStr = 'node {query}';
    const queryArgs = {
      '{query}': 'abc',
    };
    const appendQuotes = true;

    const result = applyArgs({ str: scriptStr, queryArgs, appendQuotes });

    expect(result).toStrictEqual(`node "abc"`);
  });

  test('extractArgsFromPluginItem test', async () => {
    const item = {
      type: 'keyword',
      bundleId: 'bundleId',
      title: 'some title',
      arg: 'some arg',
    };

    const result = await extractArgsFromPluginItem(item);

    const expected = {
      '{query}': 'some arg',
      $1: 'some arg',
    };

    expect(result['{query}']).toStrictEqual(expected['{query}']);
    expect(result['$1']).toStrictEqual(expected['$1']);
  });

  test('extractArgsFromQuery test', async () => {
    const querys = ['abc.js', 'some_arg=arg'];
    const result = await extractArgsFromQuery(querys);
    const expected = {
      '{query}': 'abc.js some_arg=arg',
      $1: 'abc.js',
      $2: 'some_arg=arg',
    };

    expect(result['{query}']).toStrictEqual(expected['{query}']);
    expect(result['$1']).toStrictEqual(expected['$1']);
    expect(result['$2']).toStrictEqual(expected['$2']);
  });

  test('extractArgsFromScriptFilterItem test with object arg', async () => {
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

    const result = await extractArgsFromScriptFilterItem(item, vars);

    const expected = {
      arg1: 'arg1',
      '{var:var1}': 'var1',
      '{var:var2}': 'var2'
    };

    expect(result['arg1']).toStrictEqual(expected['arg1']);
    expect(result['{var:var1}']).toStrictEqual(expected['{var:var1}']);
    expect(result['{var:var2}']).toStrictEqual(expected['{var:var2}']);
  });

  test('extractArgsFromScriptFilterItem test with string arg', async () => {
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

    const result = await extractArgsFromScriptFilterItem(item, vars);

    const expected = {
      '{query}': 'abcdefg',
      $1: 'abcdefg',
      '{var:var1}': 'var1',
      '{var:var2}': 'var2'
    };

    expect(result['{query}']).toStrictEqual(expected['{query}']);
    expect(result['$1']).toStrictEqual(expected['$1']);
    expect(result['{var:var1}']).toStrictEqual(expected['{var:var1}']);
    expect(result['{var:var2}']).toStrictEqual(expected['{var:var2}']);
  });
});
