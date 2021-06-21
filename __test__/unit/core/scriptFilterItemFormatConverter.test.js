const {
  xmlToJsonScriptFilterItemFormat,
} = require('../../../dist/core/scriptFilterItemFormatConverter');

const mockXmls = {
  t1: `
  <?xml version="1.0" encoding="utf-8"?>
  <items>
  <item autocomplete="foo" valid="yes">
  <title>Search something 'foo'</title>
  <subtitle />
  <arg>foo</arg></item>
  
  <item autocomplete="test" valid="yes">
  <title>foo</title>
  <subtitle /><arg>test</arg></item>
  
  <item autocomplete="svillage" valid="yes">
  <title>bar</title>
  <subtitle /><arg>svillage</arg></item>
  
  </items>
  `,

  t2: `
  <?xml version="1.0" encoding="utf-8"?>
  <items>
  <item autocomplete="foo" valid="yes">
  <title>Search something 'foo'</title>
  <subtitle />
  <arg>foo</arg></item>
  </items>
  `,

  t3: `
  <?xml version="1.0" encoding="utf-8"?>
  <items />
  `,

  t4: `
  <?xml version="1.0" encoding="utf-8"?>
  <items>
  <item>
  <valid>yes</valid>
  <autocomplete>foo</autocomplete>
  <title>Search something 'foo'</title>
  <subtitle>hi</subtitle>
  <quicklookurl>foobar.com</quicklookurl>
  <arg>foo</arg></item>
  </items>
  `,
};

const expectedJsonItems = {
  t1: [
    {
      arg: 'foo',
      subtitle: undefined,
      title: "Search something 'foo'",
      valid: 'yes',
      autocomplete: 'foo',
      quicklookurl: undefined,
      type: undefined,
      uid: undefined,
      icon: { path: undefined },
      mod: {},
      text: { copy: undefined, largetype: '' },
    },
    {
      arg: 'test',
      subtitle: undefined,
      title: 'foo',
      valid: 'yes',
      autocomplete: 'test',
      quicklookurl: undefined,
      type: undefined,
      uid: undefined,
      icon: { path: undefined },
      mod: {},
      text: { copy: undefined, largetype: '' },
    },
    {
      arg: 'svillage',
      subtitle: undefined,
      title: 'bar',
      valid: 'yes',
      autocomplete: 'svillage',
      quicklookurl: undefined,
      type: undefined,
      uid: undefined,
      icon: { path: undefined },
      mod: {},
      text: { copy: undefined, largetype: '' },
    },
  ],
  t2: [
    {
      arg: 'foo',
      subtitle: undefined,
      title: "Search something 'foo'",
      valid: 'yes',
      autocomplete: 'foo',
      quicklookurl: undefined,
      type: undefined,
      uid: undefined,
      icon: { path: undefined },
      mod: {},
      text: { copy: undefined, largetype: '' },
    },
  ],
  t3: [],
  t4: [
    {
      arg: 'foo',
      subtitle: 'hi',
      title: "Search something 'foo'",
      valid: 'yes',
      autocomplete: 'foo',
      quicklookurl: 'foobar.com',
      type: undefined,
      uid: undefined,
      icon: { path: undefined },
      mod: {},
      text: { copy: undefined, largetype: '' },
    },
  ],
};

describe('xmlScriptFilterItemToJsonScriptFilterItem', () => {
  test('xmlToJsonScriptFilterItemFormat should extract valid items', () => {
    const { items: t1Items } = xmlToJsonScriptFilterItemFormat(mockXmls.t1);
    expect(t1Items.length).toBe(3);
    expect(t1Items).toStrictEqual(expectedJsonItems.t1);

    const { items: t2Items } = xmlToJsonScriptFilterItemFormat(mockXmls.t2);
    expect(t2Items.length).toBe(1);
    expect(t2Items).toStrictEqual(expectedJsonItems.t2);

    const { items: t3Items } = xmlToJsonScriptFilterItemFormat(mockXmls.t3);
    expect(t3Items.length).toBe(0);
    expect(t3Items).toStrictEqual(expectedJsonItems.t3);

    const { items: t4Items } = xmlToJsonScriptFilterItemFormat(mockXmls.t4);
    expect(t4Items.length).toBe(1);
    expect(t4Items).toStrictEqual(expectedJsonItems.t4);
  });
});
