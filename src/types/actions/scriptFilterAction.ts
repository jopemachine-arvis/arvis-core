import '../';

export interface ScriptFilterAction {
  type: 'scriptfilter';
  script_filter: string | object;
  action: Action[];
  withspace?: boolean;
  arg_type?: 'required' | 'optinal' | 'no';
  modifiers?: string;
}
