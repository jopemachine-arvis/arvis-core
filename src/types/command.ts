export {};

declare global {
  export interface Command {
    actions?: Action[];
    argType?: 'required' | 'optional' | 'no';
    bundleId?: string;
    command?: string;
    hotkey?: string;
    modifiers?: string;
    runningSubtext?: string;
    scriptFilter?: string | Record<string, any>;
    subtitle?: string;
    title?: string;
    type: 'keyword' | 'scriptFilter' | 'hotkey';
    withspace?: boolean;
  }
}
