export {};
import '../index';

declare global {
  export interface NotiAction extends Action {
    readonly type: 'notification';
    title: string;
    text: string;
  }
}
