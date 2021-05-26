const {
  WorkManager,
  installWorkflow,
  uninstallWorkflow,
} = require('../../../../dist/core');
const path = require('path');
const { getWorkflowInstalledPath } = require('../../../../dist/config/path');
const { checkFileExists, sleep } = require('../../../../dist/utils');
const mockWorkflowInfo = require('../../arvis-mock-workflow.json');

// Ref:: arvis-mock-workflow: https://github.com/jopemachine/arvis-mock-workflow

describe('commandExecute test', () => {
  beforeAll(async () => {
    jest.setTimeout(10000);

    let parentPathArr = __dirname.split(path.sep);
    parentPathArr.pop();
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

  it('Simple script execution test', async () => {
    const workManager = WorkManager.getInstance();

    let resultItems, resultNeedIndexInfoClear;

    const onItemShouldBeUpdate = ({ items, needIndexInfoClear }) => {
      resultItems = items;
      resultNeedIndexInfoClear = needIndexInfoClear;
    };

    workManager.onItemShouldBeUpdate = onItemShouldBeUpdate;

    await workManager.commandExcute(
      { ...mockWorkflowInfo.commands[3], bundleId: 'arvis-mock-workflow' },
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
});
