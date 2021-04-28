import '..';
import { ConditionalAction } from './ConditionalAction';

export interface If {
  cond: string;
  action: ConditionalAction;
}
