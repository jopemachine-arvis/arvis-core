export {};
import '../index';

declare global {
  export interface KeyDispatchingAction extends Action {
    readonly type: 'keyDispatching';
    readonly target: KeyDispatchingTarget;
  }
}
