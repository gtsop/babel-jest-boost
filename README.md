# babel-jest-boost

# Description

Improve the performance of your jest tests via bypassing re-exports and barel files which prevents jest from requiring, compiling and running code you did not intend to run.

This plugin modifies your code test-time (when babel-jest transpiles your code to be ran in jest). It will figure out the original exporter of every specifier imported in the files and modify these imports to directly require the specifiers from the original exporter. For instance, assume this file structure:

```bash
.
├── lib
│   ├── lib.js     // export function libFunc () {}
│   └── index.js   // export * from './lib.js'
└── code.js        // import { libFunc } from './lib';
```

When ran in jest, this plugin will convert the import statement in `code.js` to:

```javascript
import { libFunc } from '/home/myuser/myproject/lib/lib.js';
```

It will also replace `jest.mock()` function calls in exaclty the same manner.

# Integration

## 1. Install the package

```bash
npm install -D @gtsopanoglou/babel-jest-boost
```

## 2. Update your babel-jest transformer

### Option 1: `babel-jest-boost/plugin`

You may use `babel-jest-boost` as a regular babel plugin. It needs access to your jest config (`moduleNameMapper` and `modulePaths` in particular). To help you do that we export a `jestConfig` object:

```javascript
+ const { jestConfig } = require("@gtsopanoglou/babel-jest-boost/config");

 ...
 
 plugins: [
     [
+       require.resolve('@gtsopanoglou/babel-jest-boost/plugin'),
+       { jestConfig, /* babel-jest-boost options */ }
     ]
 ]
```

### Option 2 (experimental): `babel-jest-boost/transformer`

This option **is not recommended yet** because it hasn't been tested thoroughly. Use can the pre-made transformer exported from `@gtsopanoglou/babel-jest-boost/transformer` which takes care of passing the `jestConfig` object for you:

```javascript
- const babelJest = require("babel-jest").default;
+ const babelJestBoost = require("@gtsopanoglou/babel-jest-boost/transformer");

- module.exports = babelJest.createTransformer({ /* babel config */ });
+ module.exports = babelJestBoost.createTransformer({ /* babel config */ }, { /* babel-jest-boost options */ });
```

## 3. Prevent `babel-jest-boost` from re-writing imports that break tests

In order to integrate this plugin you're gonna need to run your test suite and fix potential breakages. Since `babel-jest-boost` modifies the transpiled code, you'll need to clear jest's cache before each run during this step to ensure you see non-cached results:

```
jest --clearCache && jest # or whatever you testing command is
```

It is likely that some tests of yours will now break. The breakage may be caused either by some implicit dependency in your code that you're probably not aware of, or some case not being properly supported by `babel-jest-boost`. Either way, you are not goint to fix those right now. In order to overcome this problem you have two tools: `importIgnorePatterns` plugin option and the `no-boost` directive.

1. Use `importIgnorePatterns` to batch-block specific barels or paths are commonly imported in your codebase and are causing your tests to break (since you added this plugin)

2. Use `no-boost` directive to hand-pick specific test or source code files that are breaking (since you added this plugin)

3. Re-iterate until your tests are green again.

## 4. Done

Once your tests are green again you are done. You can now keep running your tests are usual without having to clear your cache.

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

## `ignoreNodeModules` **[boolean]**

Set this flag to true if you want to completely ignore all node\_modules from being traversed. Default is false.

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
- 0.1.13 Pre-commit lint, format test and github action to test again. ✅
- 0.1.14 Expose ready-made transformer to relief the user from having to pass in the jestConfig object. ✅
- 0.1.15 Performance improvements ✅
- 0.1.16 Ensure all different `jest.mock` calls are properly treated.
- 0.1.17 Expose debugging options to the user (like printing which imports are being rewritten, or the transpiled output of a particular file).
- 0.1.18 Expose a jest reporter to print a high-level overview of what the plugin did within the run (and potientialy report barel file statistics)
- 0.1.19 Performance testing: Fork some open-source codebases, integrate `babel-jest-boost` and test to measure the performance increase. Do this in the CI/CD pipeline
- 0.1.20 Figure out automatic changelog, version increase, github release, npm publish actions
