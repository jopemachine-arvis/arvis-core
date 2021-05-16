export interface PluginItem {
  title: string;
  valid?: boolean;
  subtitle?: string;
  autocomplete?: string;
  actionCallback?: (args: any) => void;
  text?: {
    copy?: string;
    largetype?: string;
  };
  icon?: {
    path?: string;
  };
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