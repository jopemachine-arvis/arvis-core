export {};

declare global {
  export interface Command {
    title: string;
    subtitle?: string;
    command?: string;
    bundleId?: string;
    modifiers?: string;
    script_filter?: string | object;
    running_subtext?: string;
    withspace?: boolean;
    arg_type?: 'required' | 'optional' | 'no';
    type: 'keyword' | 'scriptfilter' | 'hotkey';
    action?: Action[];
    stringSimilarity?: number;
  }
}
