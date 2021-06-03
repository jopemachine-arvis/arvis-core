import '.';

export interface PluginConfigFile {
  name: string;
  createdby: string;
  enabled?: boolean;
  category?: string;
  description?: string;
  readme?: string;
  webaddress?: string;
  version?: string;
  platform?: string[];
  action: Action[];
}