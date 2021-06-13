export {};

declare global {
  export interface If {
    cond: string;
    actions: ConditionalAction;
  }
}
