export {};

declare global {
  export interface HotkeyAction {
    bundleId: string;
    readonly type: 'hotkey';
    hotkey: string;
    actions: Action[];
    modifiers?: string;
  }
}
