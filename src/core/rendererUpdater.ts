import '../types';

/**
 */
const throwErrOnRendererUpdaterNotSet = (): void => {
  throw new Error('Renderer update funtions are not set!');
};

/**
 */
export const setOnWorkEndHandler = (funcArg: () => void): void => {
  Renderer.onWorkEndHandler = funcArg;
};

/**
 */
export const setOnItemPressHandler = (funcArg: () => void): void => {
  Renderer.onItemPressHandler = funcArg;
};

/**
 */
export const setOnItemShouldBeUpdate = (funcArg: ({ }: {
  items: (ScriptFilterItem | Command)[];
  needIndexInfoClear: boolean;
}) => void) => {
  Renderer.onItemShouldBeUpdate = funcArg;
};

/**
 */
export const setOnInputShouldBeUpdate = (funcArg: ({ }: {
  str: string;
  needItemsUpdate: boolean;
}) => void): void => {
  Renderer.onInputShouldBeUpdate = funcArg;
};

/**
 */
const Renderer = {
  onInputShouldBeUpdate: ({ }: {
    str: string;
    needItemsUpdate: boolean;
  }) => {
    throwErrOnRendererUpdaterNotSet();
  },

  onItemShouldBeUpdate: ({ }: {
    items: (ScriptFilterItem | Command)[];
    needIndexInfoClear: boolean;
  }) => {
    throwErrOnRendererUpdaterNotSet();
  },

  onItemPressHandler: () => {
    throwErrOnRendererUpdaterNotSet();
  },

  onWorkEndHandler: () => {
    throwErrOnRendererUpdaterNotSet();
  },

  setOnInputShouldBeUpdate,
  setOnItemPressHandler,
  setOnItemShouldBeUpdate,
  setOnWorkEndHandler,
};

export {
  Renderer
};