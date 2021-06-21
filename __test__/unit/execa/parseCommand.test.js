const { parseCommand } = require('../../../execa/lib/command');

describe('parseCommand test', () => {
  test('basic parseCommand test', () => {
    const t1 = parseCommand('node abc.js');
    expect(t1).toStrictEqual(['node', 'abc.js']);

    const t2 = parseCommand('node abc.js cdef');
    expect(t2).toStrictEqual(['node', 'abc.js', 'cdef']);
  });

  test('parseCommand test with quote', () => {
    const t1 = parseCommand('node "abc.js" \'cdef\'');
    expect(t1).toStrictEqual(['node', '"abc.js"', '\'cdef\'']);
  
    const t2 = parseCommand('node "abc.js\' "def"');
    expect(t2).toStrictEqual(['node', '"abc.js\'', '"def"']);
  });

  test('parseCommand test with unicode', () => {
    const t1 = parseCommand('node "abc.js" 🙂 "😍"');
    expect(t1).toStrictEqual(['node', '"abc.js"', '🙂', '"😍"']);
  });
});
