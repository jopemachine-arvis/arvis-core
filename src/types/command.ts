import '.';

export interface Command {
  title: string;
  subtitle?: string;
  command?: string;
  bundleId?: string;
  modifiers?: string;
  script_filter?: string | object;
  running_subtext?: string;
  withspace?: boolean;
  type: "keyword" | "scriptfilter" | "hotkey";
  action?: Action[];
}