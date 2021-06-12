export {};

declare global {
  export interface ModifierInput {
    ctrl?: boolean;
    shift?: boolean;
    cmd?: boolean;
    normal?: boolean;
  }
}
