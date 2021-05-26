const {
  WorkManager,
  installWorkflow,
  uninstallWorkflow,
  scriptFilterExcute,
} = require('../../../dist/core');
const path = require('path');
const { getWorkflowInstalledPath } = require('../../../dist/config/path');
const { checkFileExists, sleep } = require('../../../dist/utils');
const mockWorkflowInfo = require('./arvis-mock-workflow.json');

// Ref:: arvis-mock-workflow: https://github.com/jopemachine/arvis-mock-workflow

describe('commandExecute test', () => {
  beforeAll(async () => {
    await installWorkflow(
      `${__dirname}${path.sep}arvis-mock-workflow.arvisworkflow`
    );

    const workManager = WorkManager.getInstance();
    workManager.onInputShouldBeUpdate = () => {};
    workManager.onItemPressHandler = () => {};
    workManager.onWorkEndHandler = () => {};
  });

  afterAll(async () => {
    await uninstallWorkflow({ bundleId: 'arvis-mock-workflow' });
  });

  it('Simple script execution test', async () => {
    const workManager = WorkManager.getInstance();

    let resultItems, resultNeedIndexInfoClear;

    const onItemShouldBeUpdate = ({ items, needIndexInfoClear }) => {
      resultItems = items;
      resultNeedIndexInfoClear = needIndexInfoClear;
    };

    workManager.onItemShouldBeUpdate = onItemShouldBeUpdate;

    await workManager.commandExcute(
      { ...mockWorkflowInfo.commands[0], bundleId: 'arvis-mock-workflow' },
      'createFile',
      { normal: true }
    );

    expect(resultItems).toEqual([]);
    expect(resultNeedIndexInfoClear).toEqual(true);

    const expectedOutputFilePath = `${getWorkflowInstalledPath(
      'arvis-mock-workflow'
    )}${path.sep}createFile.out`;

    await sleep(1000);

    const fileExist = await checkFileExists(expectedOutputFilePath);
    expect(fileExist).toBe(true);
  });

  it('Simple scriptfilter execution test', async () => {
    const workManager = WorkManager.getInstance();
    workManager.execPath = __dirname;

    let resultItems, resultNeedIndexInfoClear;
    const onItemShouldBeUpdate = ({ items, needIndexInfoClear }) => {
      resultItems = items;
      resultNeedIndexInfoClear = needIndexInfoClear;
    };

    workManager.onItemShouldBeUpdate = onItemShouldBeUpdate;
    workManager.printWorkStack = true;
    workManager.printScriptfilter = true;

    workManager.execPath = getWorkflowInstalledPath('arvis-mock-workflow');

    await scriptFilterExcute('scriptFilter abc', {
      ...mockWorkflowInfo.commands[1],
      bundleId: 'arvis-mock-workflow',
    });

    await sleep(300);

    const expectedItems = [
      {
        title: 't1',
        subtitle: 'subtitle',
        arg: 'abc',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
      {
        title: 't2',
        subtitle: 'subtitle',
        arg: 'abc',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
      {
        title: 't3',
        subtitle: 'subtitle',
        arg: 'abc',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
      {
        title: 't4',
        subtitle: 'subtitle',
        arg: 'abc',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
    ];

    expect(resultItems).toStrictEqual(expectedItems);
    expect(resultNeedIndexInfoClear).toEqual(true);
  });
});
