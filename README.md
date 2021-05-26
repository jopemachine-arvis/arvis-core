# arvis-core

[Arvis](https://github.com/jopemachine/arvis) module.

## Build and development

```
$ yarn && yarn build
```

## Config file pathes used by arvis-core

Note that `arvis-core-nodejs` are replaced with `arvis-nodejs` in `arvis`.

### arvis-history

The arvis history log the action logs and query logs in the path below.

* Linux: `~/.config/arvis-core-nodejs` (or `$XDG_CONFIG_HOME/MyApp-nodejs`)
* macOS: `~/Library/Preferences/arvis-core-nodejs`
* Windows: `%APPDATA%\arvis-core-nodejs\Config` (for example, `C:\Users\USERNAME\AppData\Roaming\arvis-core-nodejs\Config`)

### installed workflow, plugin files

The storage path for all installed extension files is stored in the `data` path of the [env-paths](https://github.com/sindresorhus/env-paths).
(including extension's data, cache files)

* on Linux: `~/.local/share/arvis-core-nodejs` (or `$XDG_DATA_HOME/arvis-core-nodejs`)
* on macOS: `~/Library/Application Support/arvis-core-nodejs`
* on Windows: `%LOCALAPPDATA%\arvis-core-nodejs\Data` (for example, `C:\Users\USERNAME\AppData\Local\arvis-core-nodejs\Data`)

## Workflow, Plugin JSON Schema

