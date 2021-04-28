import '..';

export interface ConditionalAction {
  then: Action[];
  else: Action[];
}
