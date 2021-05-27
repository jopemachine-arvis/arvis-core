import '../';

export interface ScriptFilterAction {
  type: 'scriptfilter';
  script_filter: string | object;
  action: Action[];
  withspace?: boolean;
  modifiers?: string;
}
