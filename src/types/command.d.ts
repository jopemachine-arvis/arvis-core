interface Command {
  name: string;
  id: string;

  // default value is 'name'
  title?: string;
  subtitle: string;

  script_filter?: string;

  type: Keyword | ScriptFilter;

  action: ScriptAction | OpenAction;
}