export {};

declare global {
  export interface ClipboardAction extends AsyncAction {
    readonly type: 'clipboard';
    text: string;
  }
}
