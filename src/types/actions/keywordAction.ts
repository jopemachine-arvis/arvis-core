export {};

declare global {
  export interface KeywordAction {
    readonly type: 'keyword';
    command: string;
    actions: Action[];
    modifiers?: string;
    title?: string;
    subtitle?: string;
    withspace?: boolean;
  }
}
