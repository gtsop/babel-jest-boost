# babel-jest-boost

# Description

Improve the performance of your jest tests via bypassing re-exports and barel files which prevents jest from requiring, compiling and running code you did not intend to run.

This plugin modifies your code test-time (when babel-jest transpiles your code to be ran in jest). It will figure out the original exporter of every specifier imported in the files being ran by jest and modify these imports to directly require the specifiers from the original exporter. For instance, assume this file structure:

```
.
├── lib
│   ├── lib.js     // export function libFunc () {}
│   └── index.js   // export * from './lib.js'
└── code.js        // import { libFunc } from './lib';
```

When ran in jest, this plugin will convert the import statement in `code.js` to:

```
import { libFunc } from '/home/myuser/myproject/lib/lib.js';
```

It will also replace `jest.mock()` function calls in exaclty the same manner.

# Installation

Add the plugin to your project

```
npm install -D @gtsopanoglou/babel-jest-boost
```

# How to use

1. Use the plugin in your transformer

Modify, your babel-jest transformer to use the plugin. It needs access to jest's config, as such a helper object is being exported to help you it:

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

2. Test your codebase and block/skip problematic files

Run your test suite as normal. It is very likely that some tests of yours will now break. This will be cause by some implicit depedency in your code that you are probably not aware of, but also not willing to fix right now. It order to overcome this problem you have two tools: `importIgnorePatterns` plugin option and `no-boost` directive.

Use `importIgnorePatterns` to batch-block specific barels or paths are commonly imported in your codebase and are causing your tests to break (since you added this plugin)

Use `no-boost` directive to hand-pick specific test or source code files that are breaking since you added this plugin

3. (optional) Refactor

Now that you've blocked some files from this plugin, you have some candidates for refactoring. These files most likely have huge import lists, much mocking or implicit depdencies you did not realize. Performance aside, you will benefit from figuring out exactly what causes the problem and refactor the code to fix the issue;

## Plugin options

### `importIgnorePatterns` **[array\<string\>]**

Array of strings/regexes, files matching these regexes will block `babel-jest-boost` from bypassing them. For instance, assuming the example above:

```
.
├── lib
│   ├── lib.js     // export function libFunc () {}
│   └── index.js   // export * from './lib.js'
└── code.js        // import { libFunc } from './lib';
```

We can use `{ importIgnorePatterns: ['./lib'] }` to prevent `babel-jest-boost` from modifying any imports pointing to `lib`.

## Plugin directives

### `no-boost`

You can let the plugin know that you do not wish to boost a particular file by adding the following comment anywhere within the file (usually at the top)

```
// @babel-jest-boost no-boost
```

# TODO

- [ ] Refactor/clean up the codebase
- [ ] Add coprehensive tests
- [ ] Investigate typescript implementation
- [ ] Try on various codebases and add tests that will ensure compatibility on future versions
- [ ] Expose caching configuration (current caching increases RAM usage by a lot, give the option to shut it down at the cost of more CPU usage)
- [ ] Figure out how to relief the user from having to pass in the jestConfig object.

##
