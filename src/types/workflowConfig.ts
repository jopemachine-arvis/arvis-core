export {};

declare global {
  export interface WorkflowConfigFile {
    category?: string;
    defaultIcon?: string;
    description?: string;
    enabled?: boolean;
    platform?: string[];
    readme?: string;
    readonly commands: Readonly<Command>[];
    readonly creator: string;
    readonly name: string;
    variables?: Record<string, any>;
    version?: string;
    webAddress?: string;
    bundleId?: string;
  }
}
