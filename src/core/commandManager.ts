import { handleAction } from './actionHandler';

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

  async commandExcute(
    item: any,
    inputStr: string,
    modifier: Modifiers
  ) {
    const command = item;
    const [first, ...querys] = inputStr.split(" ");

    const args = { '\${query}': querys.join(" "), '$1': '' };

    // tslint:disable-next-line: forin
    for (const qIdx in querys) {
      args[`$${Number(qIdx) + 1}`] = querys[qIdx];
    }

    const result = await handleAction(command, { args }, modifier);

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
