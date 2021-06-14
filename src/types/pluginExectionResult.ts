export {};

declare global {
  export interface PluginExectionResult {
    readonly items: PluginItem[];
    readonly noSort?: boolean;
  }
}
