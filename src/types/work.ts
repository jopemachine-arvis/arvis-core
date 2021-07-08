import execa from 'execa';
import PCancelable from 'p-cancelable';
export {};

declare global {
  export interface Work {
    /**
     * @description Work's type
     *              Possible value is `keyword`, `scriptfilter`, `hotkey`
     */
    readonly type: string;

    /**
     * @description
     */
    input: string;

    /**
     * @description Workflow or plugin's bundleId
     */
    bundleId: string;

    /**
     * @description Applied args
     */
    args: Record<string, any> | null;

    /**
     * @description nextActions to execute
     */
    actions: Action[] | undefined;

    /**
     * @description trigger that triggers action.
     *              starts with command object or pluginItem and becomes scriptFilterItem or action
     */
    actionTrigger: Command | PluginItem | ScriptFilterItem | Action;

    /**
     * @description Used in only type is 'scriptFilter'
     *              Indicates whether scriptfilter script is running
     */
    workCompleted?: boolean;

    /**
     * @description Used in only type is 'scriptFilter'
     *              ExecaChildProcess object (promise)
     */
    workProcess?: PCancelable<execa.ExecaReturnValue<string>> | null;

    /**
     * @description Used in only type is 'scriptFilter'
     *              Scriptfilter's rerun interval
     */
    rerunInterval?: number;

    /**
     * @description Used in only type is 'scriptFilter'
     *              Scriptfilter's script execution result
     */
    items?: ScriptFilterItem[];
  }
}
