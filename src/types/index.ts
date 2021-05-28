import { ArgsAction as _ArgsAction } from './actions/argsAction';
import { ClipboardAction as _ClipboardAction } from './actions/clipboardAction';
import { CondAction as _CondAction } from './actions/condAction';
import { HotkeyAction as _HotkeyAction } from './actions/hotkeyAction';
import { KeywordAction as _KeywordAction } from './actions/keywordAction';
import { NotificationAction as _NotificationAction } from './actions/notificationAction';
import { OpenAction as _OpenAction } from './actions/openAction';
import { ScriptAction as _ScriptAction } from './actions/scriptAction';
import { ScriptFilterAction as _ScriptFilterAction } from './actions/scriptFilterAction';

import { Command as _Command } from './command';
import { Log as _Log } from './log';
import { ModifierInput as _ModifierInput } from './modifierInput';
import { PluginConfigFile as _PluginConfigFile } from './pluginConfig';
import { PluginItem as _PluginItem } from './pluginItem';
import { ScriptFilterItem as _ScriptFilterItem } from './scriptFilterItem';
import { ScriptFilterResult as _ScriptFilterResult } from './scriptFilterResult';
import { WorkflowConfigFile as _WorkflowConfigFile } from './workflowConfig';

// To do:: Need to change below codes to import this code from the CUI and GUI code side
declare global {
  type OpenAction = _OpenAction;
  type ScriptAction = _ScriptAction;
  type ClipboardAction = _ClipboardAction;
  type ScriptFilterAction = _ScriptFilterAction;
  type NotiAction = _NotificationAction; // NotificationAction is already declared in lib.dom.d.ts(882, 11)
  type ScriptFilterResult = _ScriptFilterResult;
  type KeywordAction = _KeywordAction;
  type ArgsAction = _ArgsAction;
  type CondAction = _CondAction;
  type HotkeyAction = _HotkeyAction;
  type Action =
    | OpenAction
    | ScriptAction
    | ClipboardAction
    | ScriptFilterAction
    | KeywordAction
    | ArgsAction
    | CondAction
    | NotiAction
    | HotkeyAction;
  type Log = _Log;

  type Command = _Command;
  type PluginItem = _PluginItem;
  type ScriptFilterItem = _ScriptFilterItem;
  type ModifierInput = _ModifierInput;
  type WorkflowConfigFile = _WorkflowConfigFile;
  type PluginConfigFile = _PluginConfigFile;
}

export default global;
