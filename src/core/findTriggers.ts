import '../types';

export function findTriggers(
  targetAttrs: string[],
  actions: Action[]
): Action[] {
  let triggers: Action[] = [];

  for (const action of actions) {
    for (const targetAttr of targetAttrs) {
      if ((action as any)[targetAttr]) {
        triggers.push(action);
        break;
      }
    }

    if (action['actions']) {
      triggers = [...triggers, ...findTriggers(targetAttrs, action['actions'])];
    }
  }

  return triggers;
}
