import '../index';

export interface ResetInputAction {
  type: 'resetInput';
  newInput: string;
  modifiers?: string;
  action?: Action[];
}
