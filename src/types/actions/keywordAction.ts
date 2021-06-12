export {};

declare global {
  export interface KeywordAction {
    type: 'keyword';
    command: string;
    action: Action[];
    modifiers?: string;
    title?: string;
    subtitle?: string;
    withspace?: boolean;
  }
}
