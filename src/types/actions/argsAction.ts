export {};

declare global {
  export interface ArgsAction {
    readonly type: 'args';
    arg: string;
    actions: Action[];
    modifiers?: string;
  }
}
