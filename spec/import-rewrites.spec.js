/*
 * List of syntaxes to be tested are sourced from MDN
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#syntax
 *
 */
const {
  createExpectTransform,
  createExpectPresetTransform,
} = require("./test-utils/expectTransform.js");

const expectTransform = createExpectTransform(__filename);

describe("babel-jest-boost plugin import rewrites", () => {
  it("correctly traces specifiers within all import syntaxes", () => {
    expectTransform(
      "import target from './test_tree/default';",
      `import { default as target } from "${__dirname}/test_tree/default/index.js";`,
    );
    expectTransform(
      "import * as target from './test_tree/library';",
      `import * as target from "${__dirname}/test_tree/library/index.js";`,
    );
    expectTransform(
      "import { target } from './test_tree/library';",
      `import { target } from "${__dirname}/test_tree/library/library.js";`,
    );

    expectTransform(
      "import { target as one } from './test_tree/library';",
      `import { target as one } from "${__dirname}/test_tree/library/library.js";`,
    );
    expectTransform(
      "import { one, two, target } from './test_tree/library';",
      `
       import { target } from "${__dirname}/test_tree/library/library.js";
       import { one, two } from "${__dirname}/test_tree/library/index.js";
      `,
    );
    expectTransform(
      "import { one, two, target as three } from './test_tree/library';",
      `
       import { target as three } from "${__dirname}/test_tree/library/library.js";
       import { one, two } from "${__dirname}/test_tree/library/index.js";
      `,
    );
    expectTransform(
      "import { 'some string' as target } from './test_tree/as_str';",
      `import { 'some string' as target } from "${__dirname}/test_tree/library/library.js";`,
    );
    expectTransform(
      "import defaultSpecifier, { target } from './test_tree/default_and_list';",
      `
       import { default as defaultSpecifier } from "${__dirname}/test_tree/default_and_list/index.js";
       import { target } from "${__dirname}/test_tree/library/library.js";
      `,
    );
    expectTransform(
      "import defaultSpecifier, * as target from './test_tree/default_and_list';",
      `
       import { default as defaultSpecifier } from "${__dirname}/test_tree/default_and_list/index.js";
       import * as target from "${__dirname}/test_tree/default_and_list/index.js";
      `,
    );
    expectTransform(
      "import './test_tree/library';",
      `import "${__dirname}/test_tree/library/index.js";`,
    );
  });

  it("resolves modulePaths", () => {
    expectTransform(
      "import { target } from 'library';",
      `import { target } from "${__dirname}/test_tree/library/library.js";`,
    );
  });

  it("resolves node_modules", () => {
    const oneDirUp = __dirname.replace("/spec", "");
    expectTransform(
      "import { printMsg } from 'empty-npm-package';",
      `import { printMsg } from "${oneDirUp}/node_modules/empty-npm-package/index.js";`,
    );
  });

  it("does not resolve node_modules if configured", () => {
    const noNodeModulesExpectTransform = createExpectTransform(__filename, {
      ignoreNodeModules: true,
    });
    noNodeModulesExpectTransform(
      "import { printMsg } from 'empty-npm-package';",
      "import { printMsg } from 'empty-npm-package';",
    );
  });

  describe("with @babel/preset-env", () => {
    const expectPresetTransform = createExpectPresetTransform(__filename);

    it("correctly traces specifiers within all import syntaxes", () => {
      expectPresetTransform(
        "import target from './test_tree/default';",
        `var _index = _interopRequireDefault(require("${__dirname}/test_tree/default/index.js"))`,
      );
      expectPresetTransform(
        "import * as target from './test_tree/library';",
        `var target = _interopRequireWildcard(require("${__dirname}/test_tree/library/index.js"))`,
      );
      expectPresetTransform(
        "import { target } from './test_tree/library';",
        `var _library = require("${__dirname}/test_tree/library/library.js")`,
      );
      expectPresetTransform(
        "import { target as one } from './test_tree/library';",
        `var _library = require("${__dirname}/test_tree/library/library.js")`,
      );
      expectPresetTransform(
        "import { one, two, target } from './test_tree/library';",
        [
          `var _library = require("${__dirname}/test_tree/library/library.js");`,
          `var _index = require("${__dirname}/test_tree/library/index.js");`,
        ],
      );
      expectPresetTransform(
        "import { one, two, target as three } from './test_tree/library';",
        [
          `var _library = require("${__dirname}/test_tree/library/library.js");`,
          `var _index = require("${__dirname}/test_tree/library/index.js");`,
        ],
      );
      expectPresetTransform(
        "import { 'some string' as target } from './test_tree/as_str';",
        `var _library = require("${__dirname}/test_tree/library/library.js")`,
      );
      expectPresetTransform(
        "import defaultSpecifier, { target } from './test_tree/default_and_list';",
        [
          `var _index = _interopRequireDefault(require("${__dirname}/test_tree/default_and_list/index.js"));`,
          `var _library = require("${__dirname}/test_tree/library/library.js");`,
        ],
      );
      expectPresetTransform(
        "import defaultSpecifier, * as target from './test_tree/default_and_list'; const a = defaultSpecifier; const b = target;",
        [
          `var _index = _interopRequireWildcard(require("${__dirname}/test_tree/default_and_list/index.js"));`,
          `var target = _index;`,
          `var a = _index["default"];`,
          "var b = target;",
        ],
      );
      expectPresetTransform(
        "import './test_tree/library';",
        `require("${__dirname}/test_tree/library/index.js");`,
      );
    });
  });
});
