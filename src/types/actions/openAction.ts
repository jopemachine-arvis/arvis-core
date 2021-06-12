export {};

declare global {
  export interface OpenAction {
    type: 'open';
    target: string; // local file path or url
    modifiers?: string;
    action?: Action[];
  }
}
