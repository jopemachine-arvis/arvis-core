export {};

declare global {
  export interface WorkflowConfigFile {
    bundleId?: string;
    category?: string;
    commands: Command[];
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
