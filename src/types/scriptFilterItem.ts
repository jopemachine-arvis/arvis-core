export interface ScriptFilterItem {
  title: string;
  arg?: any;
  variables?: any;
  valid?: boolean;
  subtitle?: string;
  autocomplete?: string;
  text?: {
    copy?: string;
    largetype?: string;
  };
  icon? : {
    path?: string;
  };
  bundleId?: string;
}
