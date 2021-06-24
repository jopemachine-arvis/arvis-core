export {};

declare global {
  export interface PluginConfigFile {
    readonly actions: Action[];
    category?: string;
    readonly creator: string;
    description?: string;
    enabled?: boolean;
    readonly name: string;
    platform?: string[];
    readme?: string;
    version?: string;
    webAddress?: string;
    bundleId?: string;
  }
}
