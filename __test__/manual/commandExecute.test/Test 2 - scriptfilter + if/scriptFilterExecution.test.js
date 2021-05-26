const {
  WorkManager,
  installWorkflow,
  uninstallWorkflow,
  scriptFilterExcute,
} = require('../../../../dist/core');
const path = require('path');
const { sleep } = require('../../../../dist/utils');
const mockWorkflowInfo = require('../../arvis-mock-workflow.json');

// Ref:: arvis-mock-workflow: https://github.com/jopemachine/arvis-mock-workflow

describe('commandExecute test', () => {
  beforeAll(async () => {
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

  it('Simple scriptfilter execution test', async () => {
    const workManager = WorkManager.getInstance();

    let resultItems, resultNeedIndexInfoClear;
    const onItemShouldBeUpdate = ({ items, needIndexInfoClear }) => {
      resultItems = items;
      resultNeedIndexInfoClear = needIndexInfoClear;
    };

    workManager.onItemShouldBeUpdate = onItemShouldBeUpdate;
    workManager.printWorkStack = true;
    workManager.printScriptfilter = true;

    scriptFilterExcute('scriptFilter abc', {
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
