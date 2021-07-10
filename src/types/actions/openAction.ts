export {};

declare global {
  export interface OpenAction extends Action {
    readonly type: 'open';
    target: string; // local file path or url
  }
}
