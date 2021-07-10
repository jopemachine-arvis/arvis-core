export {};

declare global {
  export interface ResetInputAction extends Action {
    readonly type: 'resetInput';
    newInput: string;
  }
}
