export {};
import '../index';

declare global {
  export interface KeyDispatchingTarget {
    readonly key: string;
    readonly modifiers: string[];
  }
}
