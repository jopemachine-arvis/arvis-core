export {};

declare global {
  export interface ModifierInput {
    readonly ctrl?: boolean;
    readonly shift?: boolean;
    readonly cmd?: boolean;
    readonly normal?: boolean;
  }
}
