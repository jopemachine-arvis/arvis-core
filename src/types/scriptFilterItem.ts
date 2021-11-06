export {};

declare global {
  export interface ScriptFilterItem {
    title: string;
    arg?: Record<string, any> | string;
    variables?: Record<string, any>;
    valid?: boolean;
    subtitle?: string;
    autocomplete?: string;
    text?: {
      readonly copy?: string;
      readonly largetype?: string;
    };
    quicklookurl?: string;
    mods?: {
      readonly ctrl?: ModItem;
      readonly shift?: ModItem;
      readonly alt?: ModItem;
      readonly fn?: ModItem;
      readonly cmd?: ModItem;
    };
    icon?:
      | {
          path?: string;
        }
      | string;
    bundleId?: string;
  }
}
