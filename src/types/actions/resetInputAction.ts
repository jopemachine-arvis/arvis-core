export {};

declare global {
  export interface ResetInputAction {
    readonly type: 'resetInput';
    newInput: string;
    modifiers?: string;
    actions?: Action[];
  }
}
