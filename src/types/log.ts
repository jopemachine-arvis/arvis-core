export {};

declare global {
  export interface Log {
    inputStr?: string;
    action?: Action;
    timestamp: number;
    readonly type: 'action' | 'query';
  }
}
