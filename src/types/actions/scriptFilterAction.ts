import '../';

export interface ScriptFilterAction {
  type: ScriptFilter;
  script_filter: string;
  action: Action[];
  withspace?: boolean;
  modifiers?: string;
}
