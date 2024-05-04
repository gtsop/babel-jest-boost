/*
 * List of syntaxes to be tested are sourced from MDN
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#syntax
 *
 */
const { createExpectTransform } = require('./test-utils/expectTransform.js');

const expectTransform = createExpectTransform(__filename);

describe('babel-jest-boost plugin import cases', () => {

  it("correctly traces specifiers within all import syntaxes", () => {
    expectTransform(
      "import target from './test_tree/default';",
      `import { default as target } from "${__dirname}/test_tree/default/index.js";`
    )
    expectTransform(
      "import * as target from './test_tree/library';",
      `import * as target from "${__dirname}/test_tree/library/index.js";`
    )
    expectTransform(
      "import { target } from './test_tree/library';",
      `import { target } from "${__dirname}/test_tree/library/library.js";`
    )

    expectTransform(
      "import { target as one } from './test_tree/library';",
      `import { target as one } from "${__dirname}/test_tree/library/library.js";`
    )
    expectTransform(
      "import { one, two, target } from './test_tree/library';",
      `
       import { target } from "${__dirname}/test_tree/library/library.js";
       import { one, two } from './test_tree/library';
      `
    )
    expectTransform(
      "import { one, two, target as three } from './test_tree/library';",
      `
       import { target as three } from "${__dirname}/test_tree/library/library.js";
       import { one, two } from './test_tree/library';
      `
    )
    expectTransform(
      "import { 'some string' as target } from './test_tree/as_str';",
      `import { 'some string' as target } from "${__dirname}/test_tree/library/library.js";`
    )
    expectTransform(
      "import defaultSpecifier, { target } from './test_tree/default_and_list';",
      `
       import { default as defaultSpecifier } from "${__dirname}/test_tree/default_and_list/index.js";
       import { target } from "${__dirname}/test_tree/library/library.js";
      `
    )
    // expectTransform(
    //   "import defaultSpecifier, * as target from './test_tree/default_and_list';",
    //   `
    //    import { default as defaultSpecifier } from "${__dirname}/test_tree/default_and_list/index.js";
    //    import * as target from "${__dirname}/test_tree/default_and_list/index.js";
    //   `
    // )
    expectTransform(
      "import './test_tree/library';",
      `import "${__dirname}/test_tree/library/index.js";`
    )
  })

  it("traces original export of specifier and replaces import statement", () => {
    expectTransform(
      "import { target } from './test_tree/library';",
      `import { target } from "${__dirname}/test_tree/library/library.js";`
    )
  })

  it("correctly traces renames", () => {
    expectTransform(
      "import { localAs } from './test_tree/local_as';",
      `import { target as localAs } from "${__dirname}/test_tree/library/library.js";`
    )
  });

  it("correctly traces global exports", () => {
    expectTransform(
      "import { target } from './test_tree/global';",
      `import { target } from "${__dirname}/test_tree/library/library.js";`
    )
  })

  it("correctly traces global rename exports", () => {
    expectTransform(
      "import { libraryGlob } from './test_tree/global_as';",
      `import { * as libraryGlob } from "${__dirname}/test_tree/library/index.js";`
    )
  })
  // it("correctly traces default exports", () => {
  //
  // }) 
  //
  // it("resolves modulePaths", () => {
  //   expectTransform(
  //     "import { foo } from 'bar';",
  //     `import { foo } from "${__dirname}/test_tree/bar/bar.js";`
  //   )
  // })
})
