import { OpenAction as _OpenAction } from "./actions/openAction";
import { ScriptAction as _ScriptAction } from "./actions/scriptAction";
import { ClipboardAction as _ClipboardAction } from "./actions/clipboardAction";
import { NotificationAction as _NotificationAction } from "./actions/notificationAction";
import { ScriptFilterAction as _ScriptFilterAction } from "./actions/scriptFilterAction";
import { ScriptFilterResult as _ScriptFilterResult } from "./scriptFilterResult";
import { KeywordAction as _KeywordAction } from "./actions/keywordAction";
import { ArgsAction as _ArgsAction } from "./actions/argsAction";
import { CondAction as _CondAction } from "./actions/condAction";

import { Keyword as _Keyword } from "./inputs/keyword";
import { ScriptFilter as _ScriptFilter } from "./inputs/scriptFilter";
import { Command as _Command } from "./command";
import { ScriptFilterItem as _ScriptFilterItem } from "./scriptFilterItem";
import { ModifierInput as _ModifierInput } from "./modifierInput";
import { WorkflowConfigFile as _WorkflowConfigFile } from "./workflowConfig";

// Need to change below codes to import this code from the CUI and GUI code side
declare global {
  type OpenAction = _OpenAction;
  type ScriptAction = _ScriptAction;
  type ClipboardAction = _ClipboardAction;
  type ScriptFilterAction = _ScriptFilterAction;
  // NotificationAction is already declared in lib.dom.d.ts(882, 11)
  type NotiAction = _NotificationAction;
  type ScriptFilterResult = _ScriptFilterResult;
  type KeywordAction = _KeywordAction;
  type ArgsAction = _ArgsAction;
  type CondAction = _CondAction;
  type Action =
    | OpenAction
    | ScriptAction
    | ClipboardAction
    | ScriptFilterAction
    | KeywordAction
    | ArgsAction
    | CondAction
    | NotiAction;

  type Keyword = _Keyword;
  type ScriptFilter = _ScriptFilter;

  type Command = _Command;
  type ScriptFilterItem = _ScriptFilterItem;
  type ModifierInput = _ModifierInput;
  type WorkflowConfigFile = _WorkflowConfigFile;
}

export default global;
