const {
  getBundleId,
  getNameFromBundleId
} = require('../../../dist/core/getBundleId');

describe('getBundleId test', () => {
  test('getBundleId test', () => {
    const t1 = getBundleId('mock', 'mock1');
    expect(t1).toBe('mock.mock1');
  });

  test('getNameFromBundleId test', () => {
    const t1 = getNameFromBundleId('mock.mock1');
    expect(t1).toBe('mock1');

    const t2 = getNameFromBundleId('mock.mock1.mock1.mock1');
    expect(t2).toBe('mock1.mock1.mock1');
  });

});
