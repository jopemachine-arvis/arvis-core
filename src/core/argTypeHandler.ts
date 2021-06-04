export const shouldExecuteCommand = ({
  item,
  inputStr,
}: {
  item: any;
  inputStr: string;
}) => {
  // arg_type's default value is optional
  // 'optional' always return true.

  if (item.arg_type === 'required') {
    const [command, querys] = inputStr.split(item.command);
    return querys.length >= 2;
  } else if (item.arg_type === 'no') {
    return inputStr === item.command;
  }

  return true;
};
