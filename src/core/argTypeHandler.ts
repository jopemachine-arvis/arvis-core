/**
 * @param  {{item:any;inputStr:string;}}
 * @description Return true if item should be executed depending on arg_type
 */
export const hasRequiredArg = ({
  item,
  inputStr,
}: {
  item: any;
  inputStr: string;
}) => {
  // arg_type's default value is optional
  // 'optional', 'no' always return true.

  if (item.arg_type === 'required') {
    const [command, querys] = inputStr.split(item.command);
    return querys.length >= 2;
  }

  return true;
};
