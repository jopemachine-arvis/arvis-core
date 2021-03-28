import '../../types';

export interface ArgsAction {
  type: "args";
  arg: string;
  action: Action[];
  modifiers?: string;
}
