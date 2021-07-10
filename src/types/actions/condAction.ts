export {};

declare global {
  export interface CondAction extends Action {
    readonly type: 'cond';
    if: If;
  }
}
