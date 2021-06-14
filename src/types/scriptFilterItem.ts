export {};

declare global {
  export interface ScriptFilterItem {
    readonly title: string;
    readonly arg?: object | string;
    readonly variables?: object;
    readonly valid?: boolean;
    readonly subtitle?: string;
    readonly autocomplete?: string;
    readonly text?: {
      readonly copy?: string;
      readonly largetype?: string;
    };
    readonly quicklookurl?: string;
    readonly mods?: {
      readonly ctrl?: {
        readonly title?: string;
        readonly subtitle?: string;
      };
      readonly shift?: {
        readonly title?: string;
        readonly subtitle?: string;
      };
      readonly alt?: {
        readonly title?: string;
        readonly subtitle?: string;
      };
      readonly fn?: {
        readonly title?: string;
        readonly subtitle?: string;
      };
      readonly cmd?: {
        readonly title?: string;
        readonly subtitle?: string;
      };
    };
    icon?:
      | {
          path?: string;
        }
      | string;
    bundleId?: string;
  }
}
