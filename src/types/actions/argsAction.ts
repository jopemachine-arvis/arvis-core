export {};

declare global {
  export interface ArgsAction extends Action {
    readonly type: 'args';
    arg: string;
    actions: Action[];
  }
}
