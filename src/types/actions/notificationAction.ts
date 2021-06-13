export {};
import '../index';

declare global {
  export interface NotiAction {
    readonly type: 'notification';
    title: string;
    text: string;
    modifiers?: string;
    actions: Action[];
  }
}
