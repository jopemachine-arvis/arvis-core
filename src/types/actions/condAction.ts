import '..';
import { If } from './if';

export interface CondAction {
  type: 'cond';
  if: If;
  modifiers?: string;
}
