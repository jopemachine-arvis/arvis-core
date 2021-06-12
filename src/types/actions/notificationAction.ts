export {};
import "../index";

declare global {
  export interface NotiAction {
    type: 'notification';
    title: string;
    text: string;
    modifiers?: string;
    action: Action[];
  }
}
