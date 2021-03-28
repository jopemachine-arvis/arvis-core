import '.';

// Add more attributes if necessary
export interface WorkflowConfigFile {
  bundleId: string;
  commands: Command[];

  name?: string;
  category?: string;
  createdby?: string;
  description?: string;
  readme?: string;
  webaddress?: string;
  version?: string;
}