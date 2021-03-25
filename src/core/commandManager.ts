import { handleCommandExecute } from './commandHandler';

interface Work {
  type: string;
  command: string;
}

interface Modifiers {
  ctrl: boolean;
  cmd: boolean;
  shift: boolean;
}

export class CommandManager {
  commandStk: Work[];
  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: any) => void;

  constructor() {
    this.commandStk = [];
  }

  async commandExcuteHandler(
    item: any,
    inputStr: string,
    modifier: Modifiers
  ) {
    const command = item;
    const [first, ...querys] = inputStr.split(" ");

    const args = { '\${query}': querys.join(" ") };
    // tslint:disable-next-line: forin
    for (const qIdx in querys) {
      args[`$${qIdx + 1}`] = querys[qIdx];
    }

    const result = await handleCommandExecute(command, { args }, modifier);

    if (result!.stdout) {
      const newItems = JSON.parse(result!.stdout!).items;
      this.onItemShouldBeUpdate && this.onItemShouldBeUpdate(newItems);
    }

    if (result!.nextActions) {
      this.commandStk.push({
        type: command.type,
        command: inputStr,
      });
    } else {
      // clear command stack
      this.commandStk.length = 0;
    }

    this.onItemPressHandler && this.onItemPressHandler();
  }
}
