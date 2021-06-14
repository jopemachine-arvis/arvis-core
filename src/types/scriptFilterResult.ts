export {};

declare global {
  export interface ScriptFilterResult {
    readonly items: ScriptFilterItem[];
    readonly variables?: any;
    readonly rerun?: number;
  }
}
