const { createExpectTransform } = require("./test-utils/expectTransform.js");

const expectTransform = createExpectTransform(__filename);

describe("no-boost directive", () => {
  it("ignores all import statements when the comment '@babel-jest-boost no-boost' exists", () => {
    expectTransform(
      `
        // @babel-jest-boost no-boost
        import { target } from './test_tree/library';
      `,
      `
        // @babel-jest-boost no-boost
        import { target } from './test_tree/library';
      `,
    );
  });

  it("ignores the specified import statements when the comment '@babel-jest-boost no-boost-next' exists", () => {
    expectTransform(
      `
        import { a } from './test_tree/consts';
        // @babel-jest-boost no-boost-next
        import { b } from './test_tree/consts';
        import { c } from './test_tree/consts';
        // @babel-jest-boost no-boost-next
        import { d } from './test_tree/consts';
      `,
      `
        import { a } from "${__dirname}/test_tree/consts/a.js";
        // @babel-jest-boost no-boost-next
        import { b } from './test_tree/consts';
        import { c } from "${__dirname}/test_tree/consts/consts.js";
        // @babel-jest-boost no-boost-next
        import { d } from './test_tree/consts';
      `,
    );
  });
});
