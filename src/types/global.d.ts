import { OpenAction as _OpenAction } from './actions/openAction.d';
import { ScriptAction as _ScriptAction } from './actions/scriptAction.d';
import { Keyword as _Keyword } from './inputs/keyword.d';
import { ScriptFilter as _ScriptFilter } from './inputs/scriptFilter.d';
import { Command as _Command } from './command.d';
import { ScriptFilterItem as _ScriptFilterItem } from './scriptFilterItem.d';
import { ModifierInput as _ModifierInput } from './modifierInput.d';

declare global {
  type OpenAction = _OpenAction;
  type ScriptAction = _ScriptAction;
  type Keyword = _Keyword;
  type ScriptFilter = _ScriptFilter;
  type Command = _Command;
  type ScriptFilterItem = _ScriptFilterItem;
  type ModifierInput = _ModifierInput;
}

export default global;