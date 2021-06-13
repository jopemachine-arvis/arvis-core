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
  // argType's default value is optional
  // 'optional', 'no' always return true.

  if (item.argType === 'required') {
    const [command, querys] = inputStr.split(item.command);
    if (!querys) return false;
    return querys.length >= 2;
  }

  return true;
};
