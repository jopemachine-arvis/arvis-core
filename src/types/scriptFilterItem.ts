export interface ScriptFilterItem {
  title: string;
  arg?: any;
  variable?: any;
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
