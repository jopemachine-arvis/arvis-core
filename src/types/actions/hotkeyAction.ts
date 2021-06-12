export {};

declare global {
  export interface HotkeyAction {
    bundleId: string;
    type: 'hotkey';
    hotkey: string;
    action: Action[];
    modifiers?: string;
  }
}
