export {};

declare global {
  export interface ScriptAction {
    readonly type: 'script';
    script: string | Record<string, any>;
    modifiers?: string;
    actions?: Action[];
  }
}
