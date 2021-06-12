export {};

declare global {
  export interface CondAction {
    type: 'cond';
    if: If;
    modifiers?: string;
  }
}
