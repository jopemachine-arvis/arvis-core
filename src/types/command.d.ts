import './global.d';

export interface Command {
  // default value is 'name'
  title: string;
  subtitle: string;
 
  modifiers?: string;
  script_filter?: string;
  running_subtext?: string;
  withspace: boolean;

  type: Keyword | ScriptFilter;
  action: (ScriptAction | OpenAction)[];
}