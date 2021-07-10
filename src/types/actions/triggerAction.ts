export {};

declare global {
  type TriggerAction = KeywordAction | ScriptFilterAction | HotkeyAction | ResetInputAction;
}
