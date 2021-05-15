import '.';

export interface WorkflowConfigFile {
  bundleId: string;
  commands: Command[];
  name?: string;
  enabled?: boolean;
  category?: string;
  createdby?: string;
  description?: string;
  readme?: string;
  webaddress?: string;
  version?: string;
  platform?: string[];
}