const { createExpectTransform } = require("./test-utils/expectTransform.js");

const expectTransform = createExpectTransform(__filename);

describe("edge cases", () => {
  it("does nothing when there is no code", () => {
    expectTransform("", "");
  });

  it("does not change regular code", () => {
    expectTransform("const a = 1;", "const a = 1;");
  });

  it("does not change exports", () => {
    expectTransform("export { foo } from 'foo';", "export { foo } from 'foo';");
  });

  it("does not change unresolvable imports", () => {
    expectTransform(
      "import { none } from 'unresolvable';",
      "import { none } from 'unresolvable';",
    );
  });
});
