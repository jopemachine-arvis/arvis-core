export {};

declare global {
  export interface PluginExectionResult {
    items: PluginItem[];
    noSort?: boolean;
  }
}
