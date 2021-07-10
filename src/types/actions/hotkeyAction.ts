export {};

declare global {
  export interface HotkeyAction extends Action {
    bundleId: string;
    readonly type: 'hotkey';
    hotkey: string;
    actions: Action[];
  }
}
