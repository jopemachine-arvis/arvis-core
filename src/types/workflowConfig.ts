export {};

declare global {
  export interface WorkflowConfigFile {
    category?: string;
    readonly commands: Command[];
    readonly creator: string;
    description?: string;
    enabled?: boolean;
    readonly name: string;
    platform?: string[];
    readme?: string;
    version?: string;
    webAddress?: string;
  }
}
