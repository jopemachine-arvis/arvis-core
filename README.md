# arvis-core
[![CodeFactor](https://www.codefactor.io/repository/github/jopemachine/arvis-core/badge)](https://www.codefactor.io/repository/github/jopemachine/arvis-core)
[![Known Vulnerabilities](https://snyk.io/test/github/jopemachine/arvis-core/badge.svg)](https://github.com/jopemachine/arvis-core)
[![CI](https://github.com/jopemachine/arvis-core/actions/workflows/main.yml/badge.svg)](https://github.com/jopemachine/arvis-core/actions)
[![NPM version](https://badge.fury.io/js/arvis-core.svg)](http://badge.fury.io/js/arvis-core)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![PR's Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)
[![GitHub issues](https://img.shields.io/github/issues/jopemachine/arvis-core.svg)](https://GitHub.com/jopemachine/arvis-core/issues/)

[Arvis](https://github.com/jopemachine/arvis) module.

This library aims to handle logics separated from rendering specific logic.

You can find more detailed documentation on above [page](https://github.com/jopemachine/arvis).


## Build and development

```
$ npm i && npm run build
```

## Config file pathes used by arvis-core

Note that `arvis-core-nodejs` string are replaced with `arvis-nodejs` in `arvis`.

### arvis-history

The arvis history log the action logs and query logs in the path below.

* Linux: `~/.config/arvis-core-nodejs` (or `$XDG_CONFIG_HOME/arvis-core-nodejs`)
* macOS: `~/Library/Preferences/arvis-core-nodejs`
* Windows: `%APPDATA%\arvis-core-nodejs\Config` (for example, `C:\Users\USERNAME\AppData\Roaming\arvis-core-nodejs\Config`)

### Installed workflow, plugin file paths

The storage path for all installed extension files is stored in the `data` path of the [env-paths](https://github.com/sindresorhus/env-paths).
(including extension's data, cache files)

* on Linux: `~/.local/share/arvis-core-nodejs` (or `$XDG_DATA_HOME/arvis-core-nodejs`)
* on macOS: `~/Library/Application Support/arvis-core-nodejs`
* on Windows: `%LOCALAPPDATA%\arvis-core-nodejs\Data` (for example, `C:\Users\USERNAME\AppData\Local\arvis-core-nodejs\Data`)

## Related

- [arvis](https://github.com/jopemachine/arvis) - Arvis GUI

- [arvis-extension-validator](https://github.com/jopemachine/arvis-extension-validator) - Arvis extension's JSON schema, cli and library to validate these.

- [alfred-to-arvis](https://github.com/jopemachine/alfred-to-arvis) - Help to convert alfred 4 workflow's info.plist to arvis-workflow.json

