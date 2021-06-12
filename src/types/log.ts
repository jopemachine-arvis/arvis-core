export {};

declare global {
  export interface Log {
    inputStr?: string;
    action?: Action;
    timestamp: number;
    type: 'action' | 'query';
  }
}
