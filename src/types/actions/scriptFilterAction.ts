export {};

declare global {
  export interface ScriptFilterAction extends Action {
    readonly type: 'scriptFilter';
    scriptFilter: string | Record<string, any>;
    withspace?: boolean;
    readonly argType?: 'required' | 'optinal' | 'no';
  }
}
