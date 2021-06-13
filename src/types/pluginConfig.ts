export {};

declare global {
  export interface PluginConfigFile {
    name: string;
    creator: string;
    enabled?: boolean;
    category?: string;
    description?: string;
    readme?: string;
    webAddress?: string;
    version?: string;
    platform?: string[];
    actions: Action[];
  }
}
