import PCancelable from 'p-cancelable';

export {};

declare global {
  export interface PluginWorkspace {
    pluginModules: Map<string, PluginModule>;
    asyncWorks: PCancelable<PluginExectionResult[]>[];
    asyncPluginTimer: number;
    setAsyncPluginTimer: (timer: number) => void;
    generateAsyncWork: (
      pluginBundleId: string,
      asyncPluginPromise: Promise<any>,
      setTimer: boolean,
    ) => PCancelable<PluginExectionResult[]>;
    debug: (pluginExecutionResults: PluginExectionResult[]) => void;
    getAsyncWork: (
      pluginBundleId: string,
      asyncPluginPromise: Promise<any>
    ) => PCancelable<PluginExectionResult[]>;
    reload: (pluginInfos: any[], bundleIds?: string[]) => void;
    search: (inputStr: string) => Promise<{ pluginExecutionResults: PluginExectionResult[], unresolvedPlugins: PCancelable<PluginExectionResult>[] }>;
    cancelPrevious: () => void;
    restoreArvisEnvs: () => void;
    appendPluginItemAttr: (inputStr: string, pluginItems: PluginExectionResult[]) => void;
  }
}