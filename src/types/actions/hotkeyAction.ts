import '..';

export interface HotkeyAction {
  type: 'hotkey';
  hotkey: string;
  action: Action[];
  modifiers?: string;
}
