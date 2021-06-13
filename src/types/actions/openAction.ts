export {};

declare global {
  export interface OpenAction {
    readonly type: 'open';
    target: string; // local file path or url
    modifiers?: string;
    actions?: Action[];
  }
}
