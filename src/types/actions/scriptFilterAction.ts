export {};

declare global {
  export interface ScriptFilterAction {
    readonly type: 'scriptFilter';
    scriptFilter: string | object;
    actions: Action[];
    withspace?: boolean;
    readonly argType?: 'required' | 'optinal' | 'no';
    modifiers?: string;
  }
}
