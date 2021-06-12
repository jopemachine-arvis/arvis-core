export {};

declare global {
  export interface ScriptFilterResult {
    items: ScriptFilterItem[];
    variables?: any;
    rerun?: number;
  }
}
