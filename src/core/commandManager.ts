import { handleAction } from './actionHandler';
import { handleScriptFilterChange } from './scriptFilterChangeHandler';
import { createArgs } from './argsHandler';
import '../types';

interface Work {
  type: string;
  command: string;
  action: any;
}

export class CommandManager {
  commandStk: Work[];
  workPromise: Promise<any> | null;
  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: any) => void;

  constructor() {
    this.commandStk = [];
    this.workPromise = null;
  }

  async commandExcute(
    item: Command | ScriptFilterItem,
    inputStr: string,
    modifier: ModifierInput
  ) {
    // If the stack is empty, the args becomes query, otherwise args becomes arg of items
    let args;

    // If the stack is empty, the command becomes actions, otherwise the top action of the stack is 'actions'.
    let actions;

    if (this.commandStk.length === 0) {
      item = item as Command;
      actions = item;
      const [first, ...querys] = inputStr.split(" ");
      args = createArgs(querys);
    }
    else {
      item = item as ScriptFilterItem;
      const last = this.commandStk[this.commandStk.length - 1];
      actions = last.action;
      args = {
        '{query}': item.arg,
        '$1': item.arg
      };
    }

    const result = await handleAction(actions, args, modifier);

    if (result.nextAction) {
      this.commandStk.push({
        // assume:: type: 'script_filter'
        type: (item as Command).type,
        command: inputStr,
        action: result!.nextAction
      });
    } else {
      // clear command stack, and return to initial.
      this.commandStk.length = 0;
    }

    this.onItemPressHandler && this.onItemPressHandler();
  }

  scriptFilterExcute(
    item: Command,
    inputStr: string,
  ) {
    // If Command stack is 0, you can enter the script filter without a return event.
    // To handle this, push this command to commandStk
    if (this.commandStk.length === 0) {
      this.commandStk.push({
        type: 'scriptfilter',
        command: inputStr,
        action: item.action
      });
    }

    const command = item;
    const [first, ...querys] = inputStr.split(" ");
    const args = createArgs(querys);
    const scriptWork: Promise<any> = handleScriptFilterChange(command, args);

    this.workPromise = scriptWork;
    scriptWork.then(result => {
      if (this.workPromise === scriptWork) {
        const newItems = JSON.parse(result.stdout).items;
        this.onItemShouldBeUpdate && this.onItemShouldBeUpdate(newItems);
      }
    });
  }
}
