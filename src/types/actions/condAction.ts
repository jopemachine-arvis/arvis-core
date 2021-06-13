export {};

declare global {
  export interface CondAction {
    readonly type: 'cond';
    if: If;
    modifiers?: string;
  }
}
