export {};
import "../index";

declare global {
  export interface ConditionalAction {
    then: Action[];
    else?: Action[];
  }
}
