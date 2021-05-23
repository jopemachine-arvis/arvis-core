# arvis-core

[Arvis](https://github.com/jopemachine/arvis) module.

## Build and development

```
$ yarn && yarn build
```

## Config file pathes used by arvis-core

### installed workflow, plugin files

The storage path for all installed extension files is stored in the `data` path of the [env-paths](https://github.com/sindresorhus/env-paths).
(including extension's data, cache files)

* on Linux: `~/.local/share/arvis-nodejs` (or `$XDG_DATA_HOME/arvis-nodejs`)
* on macOS: `~/Library/Application Support/arvis-nodejs`
* on Windows: `%LOCALAPPDATA%\arvis-nodejs\Data` (for example, `C:\Users\USERNAME\AppData\Local\arvis-nodejs\Data`)
