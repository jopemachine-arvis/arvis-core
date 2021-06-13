export {};

declare global {
  export interface WorkflowConfigFile {
    commands: Command[];
    name: string;
    creator: string;
    enabled?: boolean;
    category?: string;
    description?: string;
    readme?: string;
    webAddress?: string;
    version?: string;
    platform?: string[];
  }
}
