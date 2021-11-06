export {};

declare global {
  export interface PluginConfigFile {
    actions: Action[];
    bundleId?: string;
    category?: string;
    creator: string;
    defaultIcon?: string;
    description?: string;
    enabled?: boolean;
    name: string;
    platform?: string[];
    readme?: string;
    variables?: Record<string, any>;
    version?: string;
    webAddress?: string;
  }
}
