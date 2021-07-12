import PCancelable from 'p-cancelable';

export {};

declare global {
  export interface PluginWorkspace {
    pluginModules: Map<string, PluginModule>;
    asyncWorks: PCancelable<PluginExectionResult[]>[];
    asyncPluginTimer: number;
    setAsyncPluginTimer: (timer: number) => void;
    getAsyncWork: (
      pluginBundleId: string,
      asyncPluginPromise: Promise<any>
    ) => PCancelable<PluginExectionResult[]>;
    reload: (pluginInfos: any[], bundleId?: string) => void;
    search: (inputStr: string) => Promise<PluginExectionResult[]>;
    cancelPrevious: () => void;
    restoreArvisEnvs: () => void;
  }
}