export {};

declare global {
  export interface Log {
    readonly inputStr?: string;
    readonly action?: Action;
    readonly bundleId: string;
    readonly timestamp: number;
    readonly type: 'action' | 'query';
  }
}
