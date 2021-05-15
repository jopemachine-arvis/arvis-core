import '../';

export interface ScriptFilterAction {
  type: ScriptFilter;
  script_filter: string | object;
  action: Action[];
  withspace?: boolean;
  modifiers?: string;
}
