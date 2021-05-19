export interface ScriptFilterItem {
  title: string;
  arg?: object | string;
  variables?: object;
  valid?: boolean;
  subtitle?: string;
  autocomplete?: string;
  text?: {
    copy?: string;
    largetype?: string;
  };
  icon?:
    | {
        path?: string;
      }
    | string;
  quicklookurl?: string;
  bundleId?: string;
  mods?: {
    ctrl?: {
      title?: string;
      subtitle?: string;
    };
    shift?: {
      title?: string;
      subtitle?: string;
    };
    alt?: {
      title?: string;
      subtitle?: string;
    };
    fn?: {
      title?: string;
      subtitle?: string;
    };
    cmd?: {
      title?: string;
      subtitle?: string;
    };
  };
}
