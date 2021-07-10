export {};

declare global {
  export interface AsyncAction extends Action {
    asyncChain?: Promise<any>;
    asyncChainType?: string;
    bundleId?: string;
  }
}
