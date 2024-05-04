const { createExpectTransform } = require('./test-utils/expectTransform.js');

const expectTransform = createExpectTransform(__filename);

describe('babel-jest-boost plugin', () => {

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
