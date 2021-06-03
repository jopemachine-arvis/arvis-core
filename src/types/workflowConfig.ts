import '.';

export interface WorkflowConfigFile {
  commands: Command[];
  name: string;
  createdby: string;
  enabled?: boolean;
  category?: string;
  description?: string;
  readme?: string;
  webaddress?: string;
  version?: string;
  platform?: string[];
}