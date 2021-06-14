import execa from '../../execa';
export {};

declare global {
  export interface Work {
    /**
     * @description Work's type
     *              Possible value is `keyword`, `keyword-waiting`, `scriptfilter`, `hotkey`
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
    args: object | null;

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
    workProcess?: execa.ExecaChildProcess | null;

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
