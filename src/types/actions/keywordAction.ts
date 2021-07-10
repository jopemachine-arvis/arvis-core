export {};

declare global {
  export interface KeywordAction extends Action {
    readonly type: 'keyword';
    readonly argType?: 'required' | 'optinal' | 'no';
    command: string;
    actions: Action[];
    title?: string;
    subtitle?: string;
    withspace?: boolean;
  }
}
