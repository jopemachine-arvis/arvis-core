export {};

declare global {
  export interface PluginWorkspace {
    appendPluginItemAttr: (inputStr: string, pluginItems: PluginExectionResult[]) => void;
    debug: (pluginExecutionResults: PluginExectionResult[]) => void;
    deferedPluginEventEmitter: any;
    executingAsyncPlugins: boolean;
    pluginExecutionHandler: (inputStr: string, pluginExecutionResults: PluginExectionResult[], errors?: Error[]) => PluginExectionResult[];
    pluginModules: Map<string, PluginModule>;
    reload: (pluginInfos: (PluginConfigFile & { envs?: Record<string, any> })[], bundleIds?: string[]) => void;
    requestIsLatest: (id: number) => boolean;
    search: (inputStr: string) => Promise<PluginExectionResult[]>;
    setAsyncPluginTimer: (timer: number) => void;
  }
}