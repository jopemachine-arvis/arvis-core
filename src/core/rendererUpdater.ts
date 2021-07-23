import '../types';

/**
 */
const throwErrOnRendererUpdaterNotSet = (): void => {
  throw new Error('Renderer update funtions are not set!');
};

export const setOnWorkEndHandler = (funcArg): void => {
  Renderer.onWorkEndHandler = funcArg;
};

export const setOnItemPressHandler = (funcArg): void => {
  Renderer.onItemPressHandler = funcArg;
};

export const setOnItemShouldBeUpdate = (funcArg): void => {
  Renderer.onItemShouldBeUpdate = funcArg;
};

export const setOnInputShouldBeUpdate = (funcArg): void => {
  Renderer.onInputShouldBeUpdate = funcArg;
};

const Renderer = {
  onInputShouldBeUpdate: ({}: {
    str: string;
    needItemsUpdate: boolean;
  }) => {
    throwErrOnRendererUpdaterNotSet();
  },

  onItemPressHandler: () => {
    throwErrOnRendererUpdaterNotSet();
  },

  onItemShouldBeUpdate: ({}: {
    items: (ScriptFilterItem | Command)[];
    needIndexInfoClear: boolean;
  }) => {
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