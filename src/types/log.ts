export {};

declare global {
  export interface Log {
    readonly inputStr?: string;
    readonly action?: Action;
    readonly timestamp: number;
    readonly type: 'action' | 'query';
  }
}
