export interface ClipboardAction {
  type: 'clipboard';
  text: string;
  modifiers?: string;
  action?: Action[];
}
