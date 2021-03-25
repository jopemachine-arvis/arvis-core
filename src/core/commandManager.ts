import { handleAction } from './actionHandler';
import util from 'util';

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
  workPromise: Promise<any> | null;
  onItemPressHandler?: () => void;
  onItemShouldBeUpdate?: (items: any) => void;

  constructor() {
    this.commandStk = [];
    this.workPromise = null;
  }

  private createArgs (querys) {
    const args = { '\${query}': querys.join(" "), '$1': '' };

    // tslint:disable-next-line: forin
    for (const qIdx in querys) {
      args[`$${Number(qIdx) + 1}`] = querys[qIdx];
    }

    return args;
  }

  async commandExcute(
    item: any,
    inputStr: string,
    modifier: Modifiers
  ) {
    const command = item;
    const [first, ...querys] = inputStr.split(" ");
    const args = this.createArgs(querys);
    const result = handleAction(command, args, modifier);

    if (result!.nextActions) {
      this.commandStk.push({
        // could be script filter
        type: command.type,
        command: inputStr,
      });
    } else {
      // clear command stack, and return to initial.
      this.commandStk.length = 0;
    }

    this.onItemPressHandler && this.onItemPressHandler();
  }

  scriptFilterExcute(
    item: any,
    inputStr: string,
    modifier: Modifiers
  ) {
    const command = item;
    const [first, ...querys] = inputStr.split(" ");
    const args = this.createArgs(querys);

    const work: Promise<any> = handleAction(command, args, modifier)!.scriptWork!;

    this.workPromise = work;
    work.then(result => {
      if (this.workPromise === work) {
        const newItems = JSON.parse(result.stdout).items;
        this.onItemShouldBeUpdate && this.onItemShouldBeUpdate(newItems);
      }
    });
  }
}
