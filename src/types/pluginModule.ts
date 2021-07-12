export {};

declare global {
  export interface PluginModule {
    module: Function;
    bindedEnvs: Record<string, any>;
  }
}