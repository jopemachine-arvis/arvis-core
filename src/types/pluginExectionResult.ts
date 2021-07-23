export {};

declare global {
  export interface PluginExectionResult {
    items: PluginItem[];
    readonly noSort?: boolean;
  }
}
