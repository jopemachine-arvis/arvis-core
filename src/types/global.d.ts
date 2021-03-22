import { OpenAction as _OpenAction } from './actions/openAction.d';
import { ScriptAction as _ScriptAction } from './actions/scriptAction.d';
import { Keyword as _Keyword } from './inputs/keyword.d';
import { ScriptFilter as _ScriptFilter } from './inputs/scriptFilter.d';

declare global {
  type OpenAction = _OpenAction;
  type ScriptAction = _ScriptAction;
  type Keyword = _Keyword;
  type ScriptFilter = _ScriptFilter;
}