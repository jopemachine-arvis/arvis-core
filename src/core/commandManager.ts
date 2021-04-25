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
  private commandStk: Work[];
  handleAction: Function;

  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: ScriptFilterItem[]) => void;

  constructor() {
    this.commandStk = [];
    this.handleAction = handleAction.bind(this);
  }

  clearCommandStack = () => {
    this.commandStk.length = 0;
  }

  // If commandStk is empty, look for command.
  hasEmptyCommandStk = () => {
    return this.commandStk.length === 0;
  }

  workIsPending = () => {
    return (
      this.commandStk.length >= 1 &&
      this.commandStk[this.commandStk.length - 1].workCompleted === false
    );
  }

  scriptFilterCompleteEventHandler = (result: any) => {
    this.commandStk[this.commandStk.length - 1].workCompleted = true;

    const newItems = (JSON.parse(result.stdout) as ScriptFilterResult).items;
    // To do:: Implement variables, rerunInterval features here
    this.onItemShouldBeUpdate && this.onItemShouldBeUpdate(newItems);
  }

  async commandExcute(
    item: Command | ScriptFilterItem,
    inputStr: string,
    modifier: ModifierInput
  ) {
    // Ignore this exeution if previous work is pending.
    if (this.workIsPending()) {
      return;
    }

    // If the stack is empty, the args becomes query, otherwise args becomes arg of items
    let args: object;

    // If the stack is empty, the command becomes actions, otherwise the top action of the stack is 'actions'.
    let actions;

    if (this.hasEmptyCommandStk()) {
      item = item as Command;
      actions = item;
      const [first, ...querys] = inputStr.split(" ");
      args = extractArgs(querys);
    } else {
      const last = this.commandStk[this.commandStk.length - 1];
      actions = last.command.action;
      item = item as ScriptFilterItem;
      args = extractArgsFromScriptFilterItem(item);
    }

    const result = this.handleAction(actions, args, modifier);

    if (result.nextAction) {
      this.commandStk.push({
        // assume:: type should be 'script_filter'
        // To do:: Other types could be added later.
        type: "scriptfilter",
        input: inputStr,
        command: result!.nextAction,
        bundleId: this.commandStk[this.commandStk.length - 1].bundleId,
        selectedArgs: args,
        workPromise: null,
        workCompleted: false,
      });
      this.scriptFilterExcute("");
    } else {
      // clear command stack, and return to initial.
      this.clearCommandStack();
      this.onItemShouldBeUpdate && this.onItemShouldBeUpdate([]);
    }

    this.onItemPressHandler && this.onItemPressHandler();
  }

  scriptFilterExcute(
    inputStr: string,
    // command object should be given when stack is empty
    commandOnStackIsEmpty?: Command
  ) {
    // If Command stack is 0, you can enter the script filter without a return event.
    // To handle this, push this command to commandStk
    if (this.hasEmptyCommandStk()) {
      if (!commandOnStackIsEmpty) {
        throw new Error("Error - command should be given when stack is empty");
      }
      this.commandStk.push({
        type: "scriptfilter",
        // user input string
        input: inputStr,
        command: commandOnStackIsEmpty,
        bundleId: commandOnStackIsEmpty.bundleId!,
        selectedArgs: null,
        workPromise: null,
        workCompleted: false,
      });
    }

    const { bundleId, command, selectedArgs } = this.commandStk[
      this.commandStk.length - 1
    ];
    const [first, ...querys] = inputStr.split(" ");
    // HACK:: Think about how to deal with the args.
    const args = selectedArgs ? selectedArgs : extractArgs(querys);
    const scriptWork: Promise<any> = handleScriptFilterChange(
      bundleId,
      command,
      args
    );

    this.commandStk[this.commandStk.length - 1].workPromise = scriptWork;

    scriptWork
      .then((result) => {
        if (
          this.commandStk[this.commandStk.length - 1].workPromise === scriptWork
        ) {
          this.scriptFilterCompleteEventHandler(result);
        }
      })
      .catch((err) => {
        console.error("Error occured in script work!\n", err);
      });
  }
}
