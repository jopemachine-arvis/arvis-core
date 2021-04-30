export interface KeywordAction {
  type: "keyword";
  command: string;
  action: Action[];
  modifiers?: string;
}
