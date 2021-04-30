export interface ScriptAction {
  type: "script";
  script: string;
  modifiers?: string;
  action?: Action[];
}