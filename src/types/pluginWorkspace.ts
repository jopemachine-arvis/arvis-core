import execa from 'execa';

export {};

declare global {
  export interface PluginWorkspace {
    appendPluginItemAttr: (inputStr: string, pluginItems: PluginExectionResult[]) => void;
    asyncQuicklookRenderEventEmitter: any;
    debug: (pluginExecutionResults: PluginExectionResult[]) => void;
    deferedPluginEventEmitter: any;
    isExecutingAsyncPlugins: () => boolean;
    isExecutingDeferedPlugins: () => boolean;
    pluginEventEmitter: any;
    pluginExecutionHandler: (inputStr: string, pluginExecutionResults: PluginExectionResult[], errors?: Error[]) => PluginExectionResult[];
    pluginExecutor: execa.ExecaChildProcess<string> | undefined;
    pluginModules: Map<string, PluginModule>;
    reload: (pluginInfos: (PluginConfigFile & { envs?: Record<string, any> })[], bundleIds?: string[]) => void;
    requestAsyncQuicklookRender: (asyncPluginItemUid: string) => Promise<string>;
    requestIsLatest: (id: number) => boolean;
    search: (inputStr: string) => Promise<PluginExectionResult[]>;
    setAsyncPluginTimer: (timer: number) => void;
    startPluginExecutor: () => execa.ExecaChildProcess<string>;
  }
}