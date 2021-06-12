import execa from '../../execa';
export {};

declare global {
  export interface Work {
    /**
     * @description Work's type
     *              Possible value is `keyword`, `keyword-waiting`, `scriptfilter`, `hotkey`
     */
    type: string;

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
     * @description nextAction to execute
     */
    action: Action[] | undefined;

    /**
     * @description trigger that triggers action.
     *              starts with command object or pluginItem and becomes scriptFilterItem or action
     */
    actionTrigger: Command | PluginItem | ScriptFilterItem | Action;

    /**
     * @description Used in only type is 'scriptfilter'
     *              Indicates whether scriptfilter script is running
     */
    workCompleted?: boolean;

    /**
     * @description Used in only type is 'scriptfilter'
     *              ExecaChildProcess object (promise)
     */
    workProcess?: execa.ExecaChildProcess | null;

    /**
     * @description Scriptfilter's rerun interval
     */
    rerunInterval?: number;

    /**
     * @description Scriptfilter's script execution result
     */
    items?: ScriptFilterItem[];
  }
}
