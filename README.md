# babel-jest-boost

# WARNING: Highly experimental (but working)

# Description

This plugin is meant to boost your jest tests' performance by altering the import statements durring the jest run. The plugin traces the original exporter of every imported specifier and alters the import statement to directly point to the original source, essentially skipping intermediate re-exports and barel files.

For instance:

```
// foo.js
export function foo () { ... }

// barel.js
export foo from './foo.js'

// bar.js
import { foo } from './barel.js'
```

In this scenario, bar will be transpiled to:

```
// bar.js
import { foo } from './foo.js';
```

# Installation

Add the plugin to your project

```
npm install -D @gtsopanoglou/babel-jest-boost
```

Modify, your babel-jest transformer to make use of it. The plugin needs access to jest's config, as such a helper function is being exported to help you do that:

```
const { jestConfig } = require("@gtsopanoglou/babel-jest-boost/config");

...

plugins: [
    [
        require.resolve('@gtsopanoglou/babel-jest-boost'),
        { jestConfig, importIgnorePatterns: [...] }
    ]
]
```

# Options

The plugin accepts a `importIgnorePatterns` list of regexes which will prevent the plugin from bypassing all the files that match. Assuming the example in the description section above, adding `importIgnorePatterns: ['barel.js']` will prevent bar from importing from 'foo.js' and will instead regularly import from 'barel.js'.

# no-boost directive

You can let the plugin know that you do not wish to boost a particular file by adding the following comment anywhere within the file (usually at the top)

```
// @babel-jest-boost no-boost
```

# Recomendation

It is recommended that you start by adding the plugin and then either add probelmatic barel files to `importIgnorePatterns` or add the `no-boost` directive to specific source/test files until your test suite is green.

