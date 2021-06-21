const { handleModifiers } = require('../../../dist/core/modifierHandler');

describe('handle Modifier', () => {

  test('handle Modifier test - basic filter', () => {
    const result = handleModifiers(
      [
        {
          type: 'clipboard',
          modifiers: 'normal',
          text: 'Test 1',
        },
        {
          type: 'clipboard',
          modifiers: 'normal',
          text: 'Test 2',
        },
        {
          type: 'clipboard',
          modifiers: 'alt',
          text: 'Test 3',
        },
        {
          type: 'clipboard',
          modifiers: 'alt',
          text: 'Test 4',
        },
        {
          type: 'clipboard',
          modifiers: 'control',
          text: 'Test 5',
        },
      ],
      {
        alt: true
      }
    );

    expect(result).toStrictEqual([
      {
        type: 'clipboard',
        modifiers: 'alt',
        text: 'Test 3',
      },
      {
        type: 'clipboard',
        modifiers: 'alt',
        text: 'Test 4',
      },
    ]);
  });

  test('handle Modifier test - auto insert normal', () => {
    const result = handleModifiers(
      [
        {
          type: 'clipboard',
          modifiers: 'normal',
          text: 'Test 1',
        },
        {
          type: 'clipboard',
          modifiers: 'normal',
          text: 'Test 2',
        },
        {
          type: 'clipboard',
          modifiers: 'alt',
          text: 'Test 3',
        },
        {
          type: 'clipboard',
          modifiers: 'alt',
          text: 'Test 4',
        },
        {
          type: 'clipboard',
          modifiers: 'control',
          text: 'Test 5',
        },
      ],
      {}
    );

    expect(result).toStrictEqual([
      {
        type: 'clipboard',
        modifiers: 'normal',
        text: 'Test 1',
      },
      {
        type: 'clipboard',
        modifiers: 'normal',
        text: 'Test 2',
      },
    ]);
  });
});
