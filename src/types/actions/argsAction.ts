export {};

declare global {
  export interface ArgsAction {
    type: 'args';
    arg: string;
    action: Action[];
    modifiers?: string;
  }
}
