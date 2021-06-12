export {};

declare global {
  type Action =
    | ArgsAction
    | CondAction
    | HotkeyAction
    | ClipboardAction
    | ResetInputAction
    | ScriptAction
    | ScriptFilterAction
    | OpenAction
    | KeywordAction
    | NotiAction;
}
