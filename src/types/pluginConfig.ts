import '.';

export interface PluginConfigFile {
  bundleId: string;
  name?: string;
  enabled?: boolean;
  category?: string;
  createdby?: string;
  description?: string;
  readme?: string;
  webaddress?: string;
  version?: string;
  platform?: string[];
  action: Action[];
}