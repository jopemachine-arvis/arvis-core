const {
  hasRequiredArg,
  isArgTypeNoButHaveArg,
  isInputMeetWithspaceCond,
} = require('../../../dist/core/argUtility');

describe('argUtility test', () => {
  test('hasRequiredArg return valid value', () => {
    const t1 = hasRequiredArg({
      item: {
        command: 'node',
        argType: 'required',
      },
      inputStr: 'node abc',
    });

    expect(t1).toBe(true);

    const t2 = hasRequiredArg({
      item: {
        command: 'node',
        argType: 'required',
      },
      inputStr: 'nod',
    });

    expect(t2).toBe(false);

    const t3 = hasRequiredArg({
      item: {
        command: 'node',
        argType: 'required',
      },
      inputStr: 'node',
    });

    expect(t3).toBe(false);

    const t4 = hasRequiredArg({
      item: {
        command: 'node',
        argType: 'required',
      },
      inputStr: 'node    ',
    });

    expect(t4).toBe(false);

    const t5 = hasRequiredArg({
      item: {
        command: 'node',
        argType: 'required',
      },
      inputStr: 'node  abc  ',
    });

    expect(t5).toBe(true);
  });

  test('isArgTypeNoButHaveArg', () => {
    const t1 = isArgTypeNoButHaveArg({
      item: {
        argType: 'no',
        command: 'node',
      },
      inputStr: 'node',
    });

    expect(t1).toBe(false);

    const t2 = isArgTypeNoButHaveArg({
      item: {
        argType: 'no',
        command: 'node',
      },
      inputStr: 'node ',
    });

    expect(t2).toBe(true);

    const t3 = isArgTypeNoButHaveArg({
      item: {
        argType: 'no',
        command: 'node',
      },
      inputStr: 'node abc',
    });

    expect(t3).toBe(true);
  });

  test('isInputMeetWithspaceCond', () => {
    const t1 = isInputMeetWithspaceCond({
      item: {
        type: 'scriptFilter',
        withspace: true,
        command: 'node',
      },
      inputStr: 'node',
    });

    expect(t1).toBe(true);

    const t2 = isInputMeetWithspaceCond({
      item: {
        type: 'scriptFilter',
        withspace: false,
        command: 'node',
      },
      inputStr: 'nodeabc',
    });

    expect(t2).toBe(true);

    const t3 = isInputMeetWithspaceCond({
      item: {
        type: 'scriptFilter',
        withspace: false,
        command: 'node',
      },
      inputStr: 'node abc',
    });

    expect(t3).toBe(true);

    const t4 = isInputMeetWithspaceCond({
      item: {
        type: 'scriptFilter',
        withspace: true,
        command: 'node',
      },
      inputStr: 'nodeabc',
    });

    expect(t4).toBe(false);

    const t5 = isInputMeetWithspaceCond({
      item: {
        type: 'scriptFilter',
        withspace: true,
        command: 'node',
      },
      inputStr: 'node abc',
    });

    expect(t5).toBe(true);
  });
});
