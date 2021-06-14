/**
 * @param  {{item:any;inputStr:string;}}
 * @description Return true if item should be executed depending on argType
 */
export const hasRequiredArg = ({
  item,
  inputStr,
}: {
  item: any;
  inputStr: string;
}) => {
  const { withspace } = item;

  const withWithspace =
    withspace &&
    (inputStr === item.command || inputStr.includes(`${item.command} `));

  const withoutWithspace = !withspace && inputStr.includes(item.command);

  if (!withWithspace && !withoutWithspace) return false;

  // argType's default value is optional
  // 'optional', 'no' always return true.
  if (item.argType === 'required') {
    const [command, querys] = inputStr.split(item.command);
    if (!querys) return false;
    return querys.length >= 2;
  }

  return true;
};
