import '..';
import { ConditionalAction } from './conditionalAction';

export interface If {
  cond: string;
  action: ConditionalAction;
}
