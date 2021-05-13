import '.';

export interface Command {
  title: string;
  subtitle: string;
  command?: string;
  bundleId?: string;
  modifiers?: string;
  script_filter?: string;
  running_subtext?: string;
  withspace?: boolean;
  type: Keyword | ScriptFilter;
  action?: (ScriptAction | OpenAction)[];
}