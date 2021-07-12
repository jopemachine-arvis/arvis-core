export {};

declare global {
  export interface Command {
    title: string;
    subtitle?: string;
    command?: string;
    hotkey?: string;
    bundleId?: string;
    modifiers?: string;
    scriptFilter?: string | Record<string, any>;
    runningSubtext?: string;
    withspace?: boolean;
    readonly argType?: 'required' | 'optional' | 'no';
    readonly type: 'keyword' | 'scriptFilter' | 'hotkey';
    actions?: Action[];
  }
}
