export {};

declare global {
  export interface PluginItem {
    title: string;
    command?: string;
    valid?: boolean;
    subtitle?: string;
    autocomplete?: string;
    arg?: Record<string, any> | string;
    variables?: Record<string, any>;
    text?: {
      copy?: string;
      largetype?: string;
    };
    quicklookurl?: string;
    mods?: {
      readonly ctrl?: ModItem;
      readonly shift?: ModItem;
      readonly alt?: ModItem;
      readonly fn?: ModItem;
      readonly cmd?: ModItem;
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
