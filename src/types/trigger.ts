import execa from 'execa';
import PCancelable from 'p-cancelable';
export {};

declare global {
  export interface Trigger {
    /**
     * Trigger's type
     * Possible value is `keyword`, `scriptfilter`, `hotkey`
     */
    readonly type: string;

    /**
     */
    input: string;

    /**
     * Extension bundleId
     */
    bundleId: string;

    /**
     * Applied args
     */
    args: Record<string, any> | null;

    /**
     * nextActions to execute
     */
    actions: Action[] | undefined;

    /**
     * trigger that triggers action.
     * starts with command object or pluginItem and becomes scriptFilterItem or action
     */
    actionTrigger: Command | PluginItem | ScriptFilterItem | Action;

    /**
     * Used in only type is 'scriptFilter'
     * Indicates whether scriptfilter script is running
     */
    scriptfilterCompleted?: boolean;

    /**
     * Used in only type is 'scriptFilter'
     * ExecaChildProcess object (promise)
     */
    scriptfilterProc?: PCancelable<execa.ExecaReturnValue<string>> | null;

    /**
     * Used in only type is 'scriptFilter'
     * Scriptfilter's rerun interval
     */
    scriptfilterRerun?: number;

    /**
     * Used in only type is 'scriptFilter'
     * Scriptfilter's script execution result
     */
    items?: ScriptFilterItem[];
  }
}
