import { handleAction } from './actionHandler';
import { handleScriptFilterChange } from './scriptFilterChangeHandler';
import { extractArgs, extractArgsFromScriptFilterItem } from './argsHandler';
import '../types';

interface Work {
  type: string;
  input: string;
  command: Command;
}

export class CommandManager {
  commandStk: Work[];
  workPromise: Promise<any> | null;
  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: ScriptFilterItem[]) => void;

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
      args = extractArgs(querys);
    }
    else {
      const last = this.commandStk[this.commandStk.length - 1];
      actions = last.command.action;
      item = item as ScriptFilterItem;
      args = extractArgsFromScriptFilterItem(item);
    }

    const result = handleAction(actions, args, modifier);

    if (result.nextAction) {
      this.commandStk.push({
        // assume:: type: 'script_filter'
        type: (item as Command).type,
        input: inputStr,
        command: result!.nextAction,
      });
    } else {
      // clear command stack, and return to initial.
      this.commandStk.length = 0;
    }

    this.onItemPressHandler && this.onItemPressHandler();
  }

  scriptFilterExcute(
    inputStr: string,
    item?: Command,
  ) {
    // If Command stack is 0, you can enter the script filter without a return event.
    // To handle this, push this command to commandStk
    if (this.commandStk.length === 0) {
      this.commandStk.push({
        type: 'scriptfilter',
        input: inputStr,
        command: item!,
      });
    }

    const command = this.commandStk[this.commandStk.length - 1].command;

    const [first, ...querys] = inputStr.split(" ");
    const args = extractArgs(querys);
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
