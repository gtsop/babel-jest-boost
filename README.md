<h1>
  <p align="center">🐠 🃏 🚀</p>
  <br/>
  <p align="center">Babel Jest Boost</p>
</h1>
<p align="center">Brings tree-shaking* to Jest, speeding up your test runs, using babel-jest</p>

## Overview

`babel-jest-boost` makes your tests run faster by solving the [problem of unecessary imports from barrel files](https://github.com/jestjs/jest/issues/11234)

It is a Babel plugin that re-writes your import statements to skip intermediate re-exports, thus bypassing barrel files.

## Usage

### 1. Install the package

```bash
npm install -D @gtsopanoglou/babel-jest-boost
```

### 2. Update your babel-jest transformer

#### Method 1

The simplest way to use this plugin is by replacing the `babel-jest` transformer with the `@gtsopanoglou/babel-jest-boost` in your jest config:

<details>
  <summary>jest.config.js</summary>
  
```diff
"transform": {
-  "\\.[jt]sx?$": "babel-jest"
+  "\\.[jt]sx?$": "@gtsopanoglou/babel-jest-boost"
}
```
</details>



#### Method 2

If you are using a script file as your transformer, you can swap the `babel-jest` transformer factory for `gtsopanoglou/babel-jest-boost` in your script. Example from ejected CRA:

<details>
  <summary>jest.config.js</summary>
  
```javascript
"transform": {
  "^.+\\.(js|jsx|mjs|cjs|ts|tsx)$": "<rootDir>/config/jest/babelTransform.js",
},
```
</details>

<details>
  <summary>config/jest/babelTransform.js</summary>
  
```diff
-const babelJest = require('babel-jest')
+const babelJest = require('@gtsopanoglou/babel-jest-boost')

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false
  }

  try {
    require.resolve('react/jsx-runtime')
    return true
  } catch (e) {
    return false
  }
})()

module.exports = babelJest.createTransformer({
  presets: [
    [
      require.resolve('babel-preset-react-app'),
      {
        runtime: hasJsxRuntime ? 'automatic' : 'classic'
      }
    ]
  ],
  babelrc: false,
  configFile: false
+}, {
+   // babel-jest-boost plugin options
})
```
</details>

#### Method 3

You may use `babel-jest-boost` as a regular babel plugin. It needs access to your jest config (`moduleNameMapper` and `modulePaths` in particular). To help you do that we export a `jestConfig` object. Again an example from an ejected CRA:

<details>
  <summary>jest.config.js</summary>
  
```javascript
"transform": {
  "^.+\\.(js|jsx|mjs|cjs|ts|tsx)$": "<rootDir>/config/jest/babelTransform.js",
},
```
</details>

<details>
  <summary>config/jest/babelTransform.js</summary>
  
```diff
const babelJest = require('babel-jest')
+const { jestConfig }  = require('@gtsopanoglou/babel-jest-boost/config')

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false
  }

  try {
    require.resolve('react/jsx-runtime')
    return true
  } catch (e) {
    return false
  }
})()

module.exports = babelJest.createTransformer({
  presets: [
    [
      require.resolve('babel-preset-react-app'),
      {
        runtime: hasJsxRuntime ? 'automatic' : 'classic'
      }
    ]
  ],
+ plugins: [
+   [
+     require.resolve('@gtsopanoglou/babel-jest-boost/plugin'),
+     {
+        jestConfig,
+        // babel-jest-boost plugin options
+     }
+  ]
+ ],
  babelrc: false,
  configFile: false
})
```
</details>

### 3. Run your tests, prevent breakages

Since `babel-jest-boost` modifies the transpiled code, you will need to clear jest's cache before each run (just for this integration phase) to ensure you see non-cached results:

```bash
jest --clearCache && jest # or whatever you testing command is
```

It is likely that some tests will now break. The breakage may be caused by some implicit dependency in your code that you're not aware of, or some bug within `babel-jest-boost`.
Either way, you are not going to fix them right now. In order to overcome this problem you have two tools: `importIgnorePatterns` plugin option and the `no-boost` directive.

Use `importIgnorePatterns` to match import statements that cause breakages when by-passed. For instance:

```javascript
import { port } from 'config';

console.log(port)
```

Use `{ importIgnorePatterns: ['config'] }` to prevent `babel-jest-boost` from re-writing this import statement.

The `no-boost` directive prevent the whole file (either test file or source code) from being parsed and re-written by `babel-jest-boost`. For instance:

```javascript
// @babel-jest-boost no-boost
import { port } from 'config';

console.log(port)
```

### 4. Re-iterate until your tests are green again.

### 5. Done

Once your tests are green, you are done. You can now keep running your tests are usual without having to clear your cache.

# Plugin options

### `importIgnorePatterns` **[array\<string\>]**

Array of strings/regexes, import paths matching these regexes will prevent `babel-jest-boost` from rewritting them. For instance, assuming the example above:

```bash
.
├── lib
│   ├── lib.js     # export function libFunc () {}
│   └── index.js   # export * from './lib.js'
└── code.js        # import { libFunc } from './lib';
```

In this scenario, `importIgnorePatterns` will be matched against the only import statement in this tree, `import { libFunc } from './lib'`, so if you wish to exclude imports to `./lib` from being re-written, you can use:

```javascript
{ importIgnorePatterns: ['./lib'] }
```

This is intended to help you defer refactoring some barrels or modules that are causing trouble or breaking your tests when you integrate this plugin.

### `ignoreNodeModules` **[boolean]**

Set this flag to true if you want to completely ignore all node\_modules imports from being re-written. Default is false.

## Plugin directives

### `no-boost`

You can let the plugin know that you do not wish to parse a particular file by adding the following comment anywhere within the file (usually at the top)

```javascript
// @babel-jest-boost no-boost
import { libFunc } from './lib';
```

Any import statements within this particular file will not be re-written.

## ROADMAP

- 0.1.11 Ensure all different import/export syntaxes are properly treated. ✅
- 0.1.12 Performance increase, tracing prioritization and defensive try/catch ✅
- 0.1.13 Pre-commit lint, format test and github action to test again. ✅
- 0.1.14 Expose ready-made transformer to relief the user from having to pass in the jestConfig object. ✅
- 0.1.15 Performance improvements ✅
- 0.1.16 ignore node_modules config option ✅
- 0.1.17 babel/preset-env compatibility ✅
- 0.1.18 Ensure all different `jest.mock` calls are properly treated.
- 0.1.19 Expose debugging options to the user (like printing which imports are being rewritten, or the transpiled output of a particular file).
- 0.1.20 Expose a jest reporter to print a high-level overview of what the plugin did within the run (and potientialy report barel file statistics)
- 0.1.21 Performance testing: Fork some open-source codebases, integrate `babel-jest-boost` and test to measure the performance increase. Do this in the CI/CD pipeline
- 0.1.22 Figure out automatic changelog, version increase, github release, npm publish actions
