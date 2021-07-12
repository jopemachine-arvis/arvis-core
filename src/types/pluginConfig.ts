export {};

declare global {
  export interface PluginConfigFile {
    category?: string;
    defaultIcon?: string;
    description?: string;
    enabled?: boolean;
    platform?: string[];
    readme?: string;
    readonly actions: Readonly<Action>[];
    readonly creator: string;
    readonly name: string;
    variables?: Record<string, any>;
    version?: string;
    webAddress?: string;
    bundleId?: string;
  }
}
