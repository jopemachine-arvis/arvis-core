import { handleAction } from './actionHandler';
import { handleScriptFilterChange } from './scriptFilterChangeHandler';
import { extractArgs, extractArgsFromScriptFilterItem } from './argsHandler';
import '../types';

interface Work {
  type: string;
  input: string;
  bundleId: string;
  selectedArgs: object | null;
  command: Command;
  workPromise?: Promise<any> | null;
  workCompleted?: boolean;
}

export class CommandManager {
  commandStk: Work[];
  handleAction: Function;
  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: ScriptFilterItem[]) => void;

  constructor() {
    this.commandStk = [];
    this.handleAction = handleAction.bind(this);
  }

  async commandExcute(
    item: Command | ScriptFilterItem,
    inputStr: string,
    modifier: ModifierInput
  ) {
    // Ignore this exeution if previous work is pending.
    if (
      this.commandStk.length >= 1 &&
      this.commandStk[this.commandStk.length - 1].workCompleted === false
    ) {
      console.log("cancel execution");
      return;
    }

    // If the stack is empty, the args becomes query, otherwise args becomes arg of items
    let args: object;

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

    const result = this.handleAction(actions, args, modifier);

    if (result.nextAction) {
      this.commandStk.push({
        // assume:: type: 'script_filter'
        type: 'scriptfilter',
        input: inputStr,
        command: result!.nextAction,
        bundleId: this.commandStk[this.commandStk.length - 1].bundleId,
        selectedArgs: args,
        workPromise: null,
        workCompleted: false,
      });
      this.scriptFilterExcute('');
    } else {
      // clear command stack, and return to initial.
      this.commandStk.length = 0;
    }

    this.onItemPressHandler && this.onItemPressHandler();
  }

  scriptFilterExcute(
    inputStr: string,
    // command object should be given when stack is empty
    commandOnStackIsEmpty?: Command,
  ) {
    // If Command stack is 0, you can enter the script filter without a return event.
    // To handle this, push this command to commandStk
    if (this.commandStk.length === 0) {
      if (!commandOnStackIsEmpty) {
        console.error('Error - item not be set');
        return;
      }
      this.commandStk.push({
        type: 'scriptfilter',
        // user input string
        input: inputStr,
        command: commandOnStackIsEmpty,
        bundleId: commandOnStackIsEmpty.bundleId!,
        selectedArgs: null,
        workPromise: null,
        workCompleted: false,
      });
    }

    const { bundleId, command, selectedArgs } = this.commandStk[this.commandStk.length - 1];
    const [first, ...querys] = inputStr.split(" ");
    // HACK:: Think about how to deal with the args.
    const args = selectedArgs ? selectedArgs : extractArgs(querys);
    const scriptWork: Promise<any> = handleScriptFilterChange(bundleId, command, args);

    this.commandStk[this.commandStk.length - 1].workPromise = scriptWork;

    scriptWork.then(result => {
      if (this.commandStk[this.commandStk.length - 1].workPromise === scriptWork) {
        this.commandStk[this.commandStk.length - 1].workCompleted = true;

        const newItems = (JSON.parse(result.stdout) as ScriptFilterResult).items;
        // To do:: Implement variables, rerunInterval features here
        this.onItemShouldBeUpdate && this.onItemShouldBeUpdate(newItems);
      } else {
        console.log('Error: newItems not updated, stdout:\n', result.stdout);
      }
    }).catch(err => {
      console.error('Error occured in script work!\n', err);
    });
  }
}
