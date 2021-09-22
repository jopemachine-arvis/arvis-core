export {};

declare global {
  export interface PluginItem {
    readonly title: string;
    readonly command?: string;
    readonly valid?: boolean;
    readonly subtitle?: string;
    readonly autocomplete?: string;
    readonly arg?: Record<string, any> | string;
    readonly variables?: Record<string, any>;
    readonly text?: {
      copy?: string;
      largetype?: string;
    };
    readonly quicklookurl?: string;
    readonly mods?: {
      readonly ctrl?: {
        title?: string;
        subtitle?: string;
      };
      readonly shift?: {
        title?: string;
        subtitle?: string;
      };
      readonly alt?: {
        title?: string;
        subtitle?: string;
      };
      readonly fn?: {
        title?: string;
        subtitle?: string;
      };
      readonly cmd?: {
        title?: string;
        subtitle?: string;
      };
    };
    actions?: Action[];
    type: 'keyword';
    icon?: {
      path?: string;
    };
    bundleId?: string;
    stringSimilarity?: number;
    isPluginItem: boolean;
  }
}
