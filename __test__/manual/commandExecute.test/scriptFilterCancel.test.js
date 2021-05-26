const {
  WorkManager,
  installWorkflow,
  uninstallWorkflow,
  scriptFilterExcute,
} = require('../../../dist/core');
const path = require('path');
const { getWorkflowInstalledPath } = require('../../../dist/config/path');
const { sleep } = require('../../../dist/utils');
const mockWorkflowInfo = require('../arvis-mock-workflow.json');

// Ref:: arvis-mock-workflow: https://github.com/jopemachine/arvis-mock-workflow

describe('commandExecute test', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);

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

  it('Pending scriptfilter cancel test', async () => {
    const workManager = WorkManager.getInstance();

    let resultItems, resultNeedIndexInfoClear;
    const onItemShouldBeUpdate = ({ items, needIndexInfoClear }) => {
      resultItems = items;
      resultNeedIndexInfoClear = needIndexInfoClear;
    };

    workManager.onItemShouldBeUpdate = onItemShouldBeUpdate;
    workManager.printWorkStack = true;
    workManager.printScriptfilter = true;
    workManager.execPath = getWorkflowInstalledPath('arvis-mock-workflow');

    workManager.workStk.push({
      workCompleted: false,
      workProcess: null,
      args: {},
      items: [],
      type: 'scriptfilter',
      action: [],
      bundleId: 'arvis-mock-workflow',
      input: '',
      actionTrigger: mockWorkflowInfo.commands[1],
    });

    scriptFilterExcute('scriptFilter scriptFilter', {
      ...mockWorkflowInfo.commands[1],
      bundleId: 'arvis-mock-workflow',
    });

    await sleep(300);

    const expectedItems = [
      {
        title: 't1',
        subtitle: 'subtitle',
        arg: 'scriptFilter',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
      {
        title: 't2',
        subtitle: 'subtitle',
        arg: 'scriptFilter',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
      {
        title: 't3',
        subtitle: 'subtitle',
        arg: 'scriptFilter',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
      {
        title: 't4',
        subtitle: 'subtitle',
        arg: 'scriptFilter',
        bundleId: 'arvis-mock-workflow',
        icon: { path: undefined },
      },
    ];

    expect(resultItems).toStrictEqual(expectedItems);
    expect(resultNeedIndexInfoClear).toEqual(true);
  });
});
