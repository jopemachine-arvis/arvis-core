export interface ScriptAction {
  type: 'script';
  script: string | object;
  modifiers?: string;
  action?: Action[];
}
