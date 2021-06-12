export {};

declare global {
  export interface If {
    cond: string;
    action: ConditionalAction;
  }
}
