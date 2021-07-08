export {};

declare global {
  export interface ScriptFilterAction {
    readonly type: 'scriptFilter';
    scriptFilter: string | Record<string, any>;
    actions: Action[];
    withspace?: boolean;
    readonly argType?: 'required' | 'optinal' | 'no';
    modifiers?: string;
  }
}
