export interface OpenAction {
  type: "open";
  // local file path or url
  target: string;
  modifiers?: string;
  action?: Action[];
}
