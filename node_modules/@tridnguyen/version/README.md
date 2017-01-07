# version

get the version of your npm package

## Install

```bash
:; npm install @tridnguyen/version
```

## Usage

### CLI

```bash
:; version
```

### Programmatically

```js
// if the script is at the root directory of your package
var v = require('@tridnguyen/version')();

// or
var v = require('@tridnguyen/version')('path/to/your/package');
```

