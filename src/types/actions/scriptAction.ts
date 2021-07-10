export {};

declare global {
  export interface ScriptAction extends AsyncAction {
    readonly type: 'script';
    script: string | Record<string, any>;
  }
}
