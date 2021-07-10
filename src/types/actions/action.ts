export {};

declare global {
  export interface Action {
    readonly type: string;
    modifiers?: string;
    actions?: Action[];
  }
}
