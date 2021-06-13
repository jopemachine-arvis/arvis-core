export {};

declare global {
  export interface ScriptAction {
    readonly type: 'script';
    script: string | object;
    modifiers?: string;
    actions?: Action[];
  }
}
