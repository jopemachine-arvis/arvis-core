const {
  WorkManager,
  installWorkflow,
  uninstallWorkflow,
  scriptFilterExcute,
} = require('../../../dist/core');
const path = require('path');
const { getWorkflowInstalledPath } = require('../../../dist/config/path');
const { checkFileExists, sleep } = require('../../../dist/utils');
const mockWorkflowInfo = require('../arvis-mock-workflow.json');

// Ref:: arvis-mock-workflow: https://github.com/jopemachine/arvis-mock-workflow

describe('commandExecute test', () => {
  beforeAll(async () => {
    jest.setTimeout(10000);

    let parentPathArr = __dirname.split(path.sep);
    parentPathArr.pop();
    const parentPath = parentPathArr.join(path.sep);

    const workflowFilePath = `${parentPath}${path.sep}arvis-mock-workflow.arvisworkflow`;
    await installWorkflow(workflowFilePath);

    const workManager = WorkManager.getInstance();

    workManager.onItemShouldBeUpdate = () => {};
    workManager.onInputShouldBeUpdate = () => {};
    workManager.onItemPressHandler = () => {};
    workManager.onWorkEndHandler = () => {};
  });

  afterAll(async () => {
    await uninstallWorkflow({ bundleId: 'arvis-mock-workflow' });
    await sleep(400);
  });

  it('Scriptfilter overlay test', async () => {
    const workManager = WorkManager.getInstance();

    let resultItems;
    const onItemShouldBeUpdate = ({ items, needIndexInfoClear }) => {
      resultItems = items;
    };

    const onInputShouldBeUpdate = ({ str, needItemsUpdate }) => {};

    workManager.onInputShouldBeUpdate = onInputShouldBeUpdate;
    workManager.onItemShouldBeUpdate = onItemShouldBeUpdate;
    workManager.execPath = getWorkflowInstalledPath('arvis-mock-workflow');

    workManager.printActionType = true;

    const expectedItems = [
      {
        title: 't1',
        subtitle: 'subtitle',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
      {
        title: 't2',
        subtitle: 'subtitle',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
      {
        title: 't3',
        subtitle: 'subtitle',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
      {
        title: 't4',
        subtitle: 'subtitle',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
    ];

    scriptFilterExcute('scriptFilter', {
      ...mockWorkflowInfo.commands[2],
      bundleId: 'arvis-mock-workflow',
    });

    await sleep(400);

    await workManager.commandExcute(
      { ...resultItems[0], bundleId: 'arvis-mock-workflow' },
      'scriptFilter',
      { normal: true }
    );

    await sleep(400);

    expect(resultItems).toStrictEqual(expectedItems);

    await workManager.commandExcute(
      { ...resultItems[0], bundleId: 'arvis-mock-workflow' },
      'scriptFilter',
      { normal: true }
    );

    await sleep(400);

    expect(resultItems).toStrictEqual(expectedItems);

    await workManager.commandExcute(
      { ...resultItems[0], bundleId: 'arvis-mock-workflow' },
      'scriptFilter',
      { normal: true }
    );

    expect(resultItems).toStrictEqual([]);

    await sleep(400);

    const expectedOutputFilePath = `${getWorkflowInstalledPath(
      'arvis-mock-workflow'
    )}${path.sep}createFile.out`;

    const fileExist = await checkFileExists(expectedOutputFilePath);

    expect(fileExist).toBe(true);
  });
});
