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

  // Used in only type is 'scriptfilter'
  workPromise?: Promise<any> | null;
  workCompleted?: boolean;
  rerunInterval?: number;
}

type CommandManagerProp = {
  printDebuggingInfo?: boolean;
};

export class CommandManager {
  private commandStk: Work[];
  private globalVariables?: any;
  printDebuggingInfo?: boolean;
  handleAction: Function;

  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: ScriptFilterItem[]) => void;

  constructor(props: CommandManagerProp) {
    this.commandStk = [];
    this.globalVariables = {};
    this.handleAction = handleAction.bind(this);
    this.printDebuggingInfo = props.printDebuggingInfo;
  }

  getTopCommand = () => {
    return this.commandStk[this.commandStk.length - 1];
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
      this.getTopCommand().workCompleted === false
    );
  }

  scriptFilterCompleteEventHandler = (result: any) => {
    const stdout = JSON.parse(result.stdout) as ScriptFilterResult;

    // Print to debugging window
    this.printDebuggingInfo && console.log('Script filter result: ', stdout);

    const { items, rerunInterval, variables } = stdout;

    this.globalVariables = { ...variables, ...this.globalVariables };
    this.commandStk[this.commandStk.length - 1].rerunInterval = rerunInterval;
    this.commandStk[this.commandStk.length - 1].workCompleted = true;

    // Append bundleId
    items.map((item: ScriptFilterItem) => {
      item.bundleId = this.getTopCommand().bundleId;
    });

    if (!this.onItemShouldBeUpdate) {
      console.error("onItemShouldBeUpdate is not set!!");
    }

    this.onItemShouldBeUpdate && this.onItemShouldBeUpdate(items);
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
      actions = this.getTopCommand().command.action;
      item = item as ScriptFilterItem;
      const vars = { ...item.variables, ...this.globalVariables! };
      args = extractArgsFromScriptFilterItem(item, vars);
    }

    const result = this.handleAction(actions, args, modifier);

    if (result.nextAction) {
      this.commandStk.push({
        // assume:: type should be 'script_filter'
        // To do:: Other types could be added later.
        type: "scriptfilter",
        input: inputStr,
        command: result!.nextAction,
        bundleId: this.getTopCommand().bundleId,
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

  async scriptFilterExcute(
    inputStr: string,
    // command object should be given when stack is empty
    commandOnStackIsEmpty?: Command
  ): Promise<any> {
    // If Command stack is empty, you can enter the script filter without a return event.
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

    const { bundleId, command, selectedArgs } = this.getTopCommand();
    const [first, ...querys] = inputStr.split(" ");
    // HACK:: Think about how to deal with the args.
    const args = selectedArgs ? selectedArgs : extractArgs(querys);
    const scriptWork: Promise<any> = handleScriptFilterChange(
      bundleId,
      command,
      args
    );

    this.commandStk[this.commandStk.length - 1].workPromise = scriptWork;

    return scriptWork
      .then((result) => {
        if (this.getTopCommand().workPromise === scriptWork) {
          this.scriptFilterCompleteEventHandler(result);
          if (this.getTopCommand().rerunInterval) {
            // Run recursive every rerunInterval
            setTimeout(() => {
              this.scriptFilterExcute(inputStr, commandOnStackIsEmpty);
            }, this.getTopCommand().rerunInterval);
          }
        }
      })
      .catch((err) => {
        if (this.hasEmptyCommandStk()) {
          // When the command has been canceled.
          console.log("Command has been canceled.\n", err);
        } else {
          // Unexpected Error
          throw new Error(err);
        }
      });
  }
}
