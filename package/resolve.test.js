const { resolve } = require("./resolve");

describe("resolve", () => {
  it("resolves .js files", () => {
    expect(
      resolve("./test_trees/tree_a/foo.js"),
      "should resolve nested .js file",
    ).toBe(`${__dirname}/test_trees/tree_a/foo.js`);
    expect(
      resolve("./test_trees/tree_a/foo"),
      "should resolve nested extensionless file",
    ).toBe(`${__dirname}/test_trees/tree_a/foo.js`);
    expect(
      resolve("./foo.js", `${__dirname}/test_trees/tree_a/`),
      "should resolve sibling .js file",
    ).toBe(`${__dirname}/test_trees/tree_a/foo.js`);
    expect(
      resolve("./foo", `${__dirname}/test_trees/tree_a/`),
      "should resolve sibling extensionless file",
    ).toBe(`${__dirname}/test_trees/tree_a/foo.js`);
    expect(
      resolve("./test_trees/tree_a/jscomponent"),
      "should resolve index file",
    ).toBe(`${__dirname}/test_trees/tree_a/jscomponent/index.js`);
  });

  it("resolves .jsx files", () => {
    expect(
      resolve("./test_trees/tree_a/baz.jsx"),
      "should resolve nested .js file",
    ).toBe(`${__dirname}/test_trees/tree_a/baz.jsx`);
    expect(
      resolve("./test_trees/tree_a/baz"),
      "should resolve nested extensionless file",
    ).toBe(`${__dirname}/test_trees/tree_a/baz.jsx`);
    expect(
      resolve("./baz.jsx", `${__dirname}/test_trees/tree_a/`),
      "should resolve sibling .js file",
    ).toBe(`${__dirname}/test_trees/tree_a/baz.jsx`);
    expect(
      resolve("./baz", `${__dirname}/test_trees/tree_a/`),
      "should resolve sibling extensionless file",
    ).toBe(`${__dirname}/test_trees/tree_a/baz.jsx`);
    expect(
      resolve("./test_trees/tree_a/jsxcomponent"),
      "should resolve index file",
    ).toBe(`${__dirname}/test_trees/tree_a/jsxcomponent/index.jsx`);
  });

  it("resolves .ts files", () => {
    expect(
      resolve("./test_trees/tree_a/bar.ts"),
      "should resolve nested .ts file",
    ).toBe(`${__dirname}/test_trees/tree_a/bar.ts`);
    expect(
      resolve("./test_trees/tree_a/bar"),
      "should resolve nested extensionless file",
    ).toBe(`${__dirname}/test_trees/tree_a/bar.ts`);
    expect(
      resolve("./bar.ts", `${__dirname}/test_trees/tree_a/`),
      "should resolve sibling .ts file",
    ).toBe(`${__dirname}/test_trees/tree_a/bar.ts`);
    expect(
      resolve("./bar", `${__dirname}/test_trees/tree_a/`),
      "should resolve sibling extensionless file",
    ).toBe(`${__dirname}/test_trees/tree_a/bar.ts`);
    expect(
      resolve("./test_trees/tree_a/tscomponent"),
      "should resolve index file",
    ).toBe(`${__dirname}/test_trees/tree_a/tscomponent/index.ts`);
  });

  it("resolves .tsx files", () => {
    expect(
      resolve("./test_trees/tree_a/qux.tsx"),
      "should resolve nested .ts file",
    ).toBe(`${__dirname}/test_trees/tree_a/qux.tsx`);
    expect(
      resolve("./test_trees/tree_a/qux"),
      "should resolve nested extensionless file",
    ).toBe(`${__dirname}/test_trees/tree_a/qux.tsx`);
    expect(
      resolve("./qux.tsx", `${__dirname}/test_trees/tree_a/`),
      "should resolve sibling .ts file",
    ).toBe(`${__dirname}/test_trees/tree_a/qux.tsx`);
    expect(
      resolve("./qux", `${__dirname}/test_trees/tree_a/`),
      "should resolve sibling extensionless file",
    ).toBe(`${__dirname}/test_trees/tree_a/qux.tsx`);
    expect(
      resolve("./test_trees/tree_a/tsxcomponent"),
      "should resolve index file",
    ).toBe(`${__dirname}/test_trees/tree_a/tsxcomponent/index.tsx`);
  });

  it("resolves node_modules/", () => {
    expect(resolve("mypack", `${__dirname}/test_trees/tree_a/`)).toBe(
      `${__dirname}/test_trees/tree_a/node_modules/mypack/index.js`,
    );
  });

  it("resolves jest's moduleNameMapper", () => {
    const moduleNameMapper = {
      mahcomp: "<rootDir>/package/test_trees/tree_a/jsxcomponent/index.jsx",
    };

    expect(
      resolve(
        "mahcomp",
        `${__dirname}/test_trees/tree_a/tsxcomponent/`,
        moduleNameMapper,
      ),
    ).toBe(`${__dirname}/test_trees/tree_a/jsxcomponent/index.jsx`);
  });

  it("resolves jest's modulePaths", () => {
    const modulePaths = [`<rootDir>/package/test_trees/tree_a/modules`];

    expect(
      resolve(
        "amodule",
        `${__dirname}/test_trees/tree_a/tsxcomponent/`,
        null,
        modulePaths,
      ),
    ).toBe(`${__dirname}/test_trees/tree_a/modules/amodule/index.js`);
  });
});
