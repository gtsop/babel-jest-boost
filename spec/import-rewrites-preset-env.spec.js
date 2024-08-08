/*
 * List of syntaxes to be tested are sourced from MDN
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#syntax
 *
 */
const { createExpectTransform } = require("./test-utils/expectTransform.js");

const expectTransform = createExpectTransform(
  __filename,
  {},
  {
    presets: [
      [
        "@babel/preset-env",
        {
          useBuiltIns: "usage",
          corejs: "3.21",
        },
      ],
    ],
  },
);

describe("babel-jest-boost plugin import rewrites when using @babel/preset-env", () => {
  it("correctly traces specifiers within all import syntaxes", () => {
    expectTransform(
      "import target from './test_tree/default';",
      `var _index = _interopRequireDefault(require("${__dirname}/test_tree/default/index.js"))`,
    );
    expectTransform(
      "import * as target from './test_tree/library';",
      `var target = _interopRequireWildcard(require("${__dirname}/test_tree/library/index.js"))`,
    );
    expectTransform(
      "import { target } from './test_tree/library';",
      `var _library = require("${__dirname}/test_tree/library/library.js")`,
    );
    expectTransform(
      "import { target as one } from './test_tree/library';",
      `var _library = require("${__dirname}/test_tree/library/library.js")`,
    );
    expectTransform("import { one, two, target } from './test_tree/library';", [
      `var _library = require("${__dirname}/test_tree/library/library.js");`,
      `var _index = require("${__dirname}/test_tree/library/index.js");`,
    ]);
    expectTransform(
      "import { one, two, target as three } from './test_tree/library';",
      [
        `var _library = require("${__dirname}/test_tree/library/library.js");`,
        `var _index = require("${__dirname}/test_tree/library/index.js");`,
      ],
    );
    expectTransform(
      "import { 'some string' as target } from './test_tree/as_str';",
      `var _library = require("${__dirname}/test_tree/library/library.js")`,
    );
    expectTransform(
      "import defaultSpecifier, { target } from './test_tree/default_and_list';",
      [
        `var _index = _interopRequireDefault(require("${__dirname}/test_tree/default_and_list/index.js"));`,
        `var _library = require("${__dirname}/test_tree/library/library.js");`,
      ],
    );
    expectTransform(
      "import defaultSpecifier, * as target from './test_tree/default_and_list'; const a = defaultSpecifier; const b = target;",
      [
        `var _index = _interopRequireWildcard(require("${__dirname}/test_tree/default_and_list/index.js"));`,
        `var target = _index;`,
        `var a = _index["default"];`,
        "var b = target;",
      ],
    );
    expectTransform(
      "import './test_tree/library';",
      `require("${__dirname}/test_tree/library/index.js");`,
    );
  });
});
