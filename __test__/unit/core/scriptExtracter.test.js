const {
  extractScriptOnThisPlatform,
} = require('../../../dist/core/scriptExtracter');

describe('scriptExtracter test', () => {
  test('scriptExtracter test', async () => {
    const t1 = extractScriptOnThisPlatform('node abc');
    expect(t1).toStrictEqual({
      script: 'node abc',
      shell: false,
    });

    const t2 = extractScriptOnThisPlatform({
      darwin: 'node abc',
      win32: 'node abc',
      linux: 'node abc',
    });

    expect(t2).toStrictEqual({
      script: 'node abc',
      shell: false,
    });

    const t3 = extractScriptOnThisPlatform({
      darwin: 'node abc',
      win32: 'node abc',
      linux: 'node abc',
      shell: true,
    });

    expect(t3).toStrictEqual({
      script: 'node abc',
      shell: true,
    });

    const t4 = extractScriptOnThisPlatform({
      darwin: {
        script: 'node abc',
        shell: 'bash',
      },
      win32: {
        script: 'node abc',
        shell: 'bash',
      },
      linux: {
        script: 'node abc',
        shell: 'bash',
      },
    });

    expect(t4).toStrictEqual({
      script: 'node abc',
      shell: 'bash',
    });
  });
});
