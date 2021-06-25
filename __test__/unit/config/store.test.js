const { Store } = require('../../../dist/config/store');

const mockdata = {
  workflow: [
    {
      creator: 'mock',
      name: 'mock1',
      bundleId: 'mock.mock1',
      commands: [
        {
          type: 'keyword',
          // mock bundleId
          bundleId: 'mock.mock1',
          command: 'ch > init',
          actions: [
            {
              modifiers: 'normal',
              type: 'script',
              script: 'node src/init.js',
            },
          ],
        },
        {
          type: 'hotkey',
          hotkey: 'Double + Ctrl',
          actions: [
            {
              type: 'keyword',
              command: 'chh',
              actions: [
                {
                  modifiers: 'normal',
                  type: 'script',
                  script: 'node src/init.js',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      creator: 'mock',
      name: 'mock2',
      bundleId: 'mock.mock2',
      commands: [
        {
          type: 'keyword',
          command: 'ch > init',
          actions: [
            {
              modifiers: 'normal',
              type: 'script',
              script: 'node src/init.js',
            },
          ],
        },
        {
          type: 'keyword',
          command: 'abc',
          actions: [
            {
              modifiers: 'normal',
              type: 'script',
              script: 'node src/init.js',
            },
          ],
        },
      ],
    },
  ],
};

describe('store test', () => {
  beforeAll(() => {
    let store = Store.getInstance();
    store.reset();
  });

  test('setWorkflow (workflow, hotkey, command) test', () => {
    let store = Store.getInstance();

    const workflowConf = mockdata.workflow[0];
    store.setWorkflow(workflowConf);

    const workflowResult = store.getInstalledWorkflows()[workflowConf.bundleId];
    expect(workflowResult).toStrictEqual(workflowConf);

    const targetCommand = workflowConf.commands[0].command;
    const commandResult = store.getCommands()[targetCommand];
    expect(commandResult).toStrictEqual([workflowConf.commands[0]]);

    const hotkeyCommand = workflowConf.commands[1];
    const targetHotkey = hotkeyCommand.hotkey;
    const hotkeyResult = store.getHotkeys()[targetHotkey];
    expect(hotkeyResult).toStrictEqual({
      ...hotkeyCommand,
      bundleId: workflowConf.bundleId,
    });
  });

  test('setWorkflow (workflow, command) test', () => {
    let store = Store.getInstance();

    const workflowConf1 = mockdata.workflow[0];
    const workflowConf2 = mockdata.workflow[1];
    store.setWorkflow(workflowConf1);
    store.setWorkflow(workflowConf2);

    const workflowsResult = store.getInstalledWorkflows();
    expect(workflowsResult).toStrictEqual({
      [workflowConf1.bundleId]: workflowConf1,
      [workflowConf2.bundleId]: workflowConf2,
    });

    const commands = store.getCommands();
    expect(commands).toStrictEqual({
      'ch > init': [
        {
          bundleId: 'mock.mock1',
          type: 'keyword',
          command: 'ch > init',
          actions: [
            {
              modifiers: 'normal',
              type: 'script',
              script: 'node src/init.js',
            },
          ],
        },
        {
          bundleId: 'mock.mock2',
          type: 'keyword',
          command: 'ch > init',
          actions: [
            {
              modifiers: 'normal',
              type: 'script',
              script: 'node src/init.js',
            },
          ],
        },
      ],
      chh: [
        {
          bundleId: 'mock.mock1',
          type: 'keyword',
          command: 'chh',
          actions: [
            {
              modifiers: 'normal',
              type: 'script',
              script: 'node src/init.js',
            },
          ],
        },
      ],
      abc: [
        {
          bundleId: 'mock.mock2',
          type: 'keyword',
          command: 'abc',
          actions: [
            {
              modifiers: 'normal',
              type: 'script',
              script: 'node src/init.js',
            },
          ],
        },
      ],
    });

    store.deleteWorkflow(workflowConf1.bundleId);

    expect(workflowsResult).toStrictEqual({
      [workflowConf2.bundleId]: workflowConf2,
    });

    expect(commands).toStrictEqual({
      'ch > init': [
        {
          bundleId: 'mock.mock2',
          type: 'keyword',
          command: 'ch > init',
          actions: [
            {
              modifiers: 'normal',
              type: 'script',
              script: 'node src/init.js',
            },
          ],
        },
      ],
      abc: [
        {
          bundleId: 'mock.mock2',
          type: 'keyword',
          command: 'abc',
          actions: [
            {
              modifiers: 'normal',
              type: 'script',
              script: 'node src/init.js',
            },
          ],
        },
      ],
    });
  });
});
