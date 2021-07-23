import _ from 'lodash';
import '../types';

/**
 * If triggerBasePath exists, include triggerPath in the return value.
 * @param targetAttrs
 * @param actions
 * @param triggerBasePath?
 */
export function findTriggers(
  targetAttrs: string[],
  actions: Readonly<Command[]> | Readonly<Action[]>,
  triggerBasePath?: string,
): Action[] | Command[] {
  let triggers: Action[] | Command[] = [];

  let actionIdx: number = 0;
  for (const action of actions) {
    for (const targetAttr of targetAttrs) {
      if ((action as any)[targetAttr] || (action as any)[targetAttr] === '') {
        const trigger: any = { ...action };
        if (triggerBasePath) {
          const triggerPath = `${triggerBasePath}.${actionIdx}`;
          trigger.triggerPath = triggerPath;
        }

        triggers.push(trigger);
        break;
      }
    }

    if (action.actions) {
      const newBasePath = triggerBasePath ? `${triggerBasePath}.${actionIdx}.actions` : undefined;
      triggers = [...triggers, ...findTriggers(targetAttrs, action.actions, newBasePath)];
    }

    ++actionIdx;
  }

  return triggers;
}
