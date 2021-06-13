export {};

declare global {
  export interface ClipboardAction {
    readonly type: 'clipboard';
    text: string;
    modifiers?: string;
    actions?: Action[];
  }
}
