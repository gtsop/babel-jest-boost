# babel-jest-boost

# Description

Improve the performance of your jest tests via bypassing re-exports and barel files which prevents jest from requiring, compiling and running code you did not intend to run.

This plugin modifies your code test-time (when babel-jest transpiles your code to be ran in jest). It will figure out the original exporter of every specifier imported in the files and modify these imports to directly require the specifiers from the original exporter. For instance, assume this file structure:

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

## 1. Use the plugin in your transformer

Modify, your babel-jest transformer to use the plugin. It needs access to jest's config, as such a helper object is being exported to help you do it:

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

## 2. Test your codebase and block/skip problematic files

In order to integrate this plugin you're gonna need to run your test suite and fix potential breakages. Since `babel-jest-boost` modifies the transpiled code, you'll need to clear jest's cache before each run during this step to ensure you see non-cached results:

```
jest --clearCache && jest # or whatever you testing command is
```

It is very likely that some tests of yours will now break. This will be caused by some implicit dependency in your code that you're probably not aware of, but also not willing to fix right now. In order to overcome this problem you have two tools: `importIgnorePatterns` plugin option and `no-boost` directive.

1. Use `importIgnorePatterns` to batch-block specific barels or paths are commonly imported in your codebase and are causing your tests to break (since you added this plugin)

2. Use `no-boost` directive to hand-pick specific test or source code files that are breaking (since you added this plugin)

3. Re-iterate until your tests are green again.

## 3. (optional) Refactor

Now that you've blocked some files from this plugin and your tests are green again, you have some candidates for refactoring. These files most likely have huge import lists, much mocking or implicit depdencies you did not realize. Performance aside, you will benefit from figuring out exactly what causes the problem and refactor the code to fix the issue

# Plugin options

## `importIgnorePatterns` **[array\<string\>]**

Array of strings/regexes, files matching these regexes will block `babel-jest-boost` from bypassing them. These regexes are being matched against the import paths within your code. For instance, assuming the example above:

```
.
├── lib
│   ├── lib.js     // export function libFunc () {}
│   └── index.js   // export * from './lib.js'
└── code.js        // import { libFunc } from './lib';
```

In this scenario, `importIgnorePatterns` will be matched against the only import statement in this tree, `import { libFunc } from './lib'`, so if you wish to exclude imports to `./lib` from being re-written, you can use:

```
{ importIgnorePatterns: ['./lib'] }
```

Here is another way of looking at it, assume your code imports a `libFunc` via a barel file:

code.js -> imports ./lib/index.js -> imports libFunc.js

The plugin will have this effect:

code.js -> imports ~~./lib/index.js imports ->~~ libFunc.js

Using `{ importIgnorePatterns: ['./lib']}` will prevent the plugin from bypassing `./lib`, leaving your code as before:

code.js -> imports ./lib/index.js -> imports libFunc.js

This is intended to help you defer refactoring some barels or modules that are causing trouble or breaking your tests when you integrate this plugin.

# Plugin directives

## `no-boost`

You can let the plugin know that you do not wish to parse a particular file by adding the following comment anywhere within the file (usually at the top)

```
// @babel-jest-boost no-boost
```

Any import statements within this particular file will not be re-written.

# ROADMAP

- 0.1.11 Ensure all different import/export syntaxes are properly treated. ✅
- 0.1.12 Performance increase, tracing prioritization and defensive try/catch ✅
- 0.1.13 Pre-commit linst, format test and github action to test again.
- 0.1.14 Expose ready-made transformer to relief the user from having to pass in the jestConfig object.
- 0.1.16 Ensure all different `jest.mock` calls are properly treated.
- 0.1.17 Expose debugging options to the user (like printing which imports are being rewritten, or the transpiled output of a particular file).
- 0.1.17 Expose a jest reporter to print a high-level overview of what the plugin did within the run (and potientialy report barel file statistics)
- 0.1.18 Performance testing: Fork some open-source codebases, integrate `babel-jest-boost` and test to measure the performance increase. Do this in the CI/CD pipeline
- 0.1.19 Figure out automatic changelog, version increase, github release, npm publish actions
