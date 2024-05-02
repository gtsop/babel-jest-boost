const babelJest = require('babel-jest').default;

const babelJestBoost = require.resolve('../package/plugin/index.js');

const transformer = babelJest.createTransformer({
  plugins: [
    [
      babelJestBoost,
      {
        jestConfig: {
          modulePaths: ['<rootDir>/spec/test_tree']
        }
      }
    ]
  ],
})

function transform(source, filename = __filename, options = {}) {
  const output = transformer.process(source, filename, { ...options, config: {} });

  return output.code.replace(/\/\/# sourceMappingURL.*/, "").trim();
}

describe('babel-jest-boost plugin', () => {

  it("does nothing when there is no code", () => {

    const output = transform('')

    expect(output).toBe("");
  })

  it("returns code as is", () => {
    const output = transform('const a  = 1;');

    expect(output).toBe("const a = 1;");
  })

  it("returns code as is", () => {
    const output = transform("import { foo } from 'foo';");

    expect(output).toBe("import { foo } from 'foo';");
  })

  it("resolves original export", () => {
    const output = transform("import { foo } from './test_tree/bar';");

    expect(output).toBe(`import { foo } from "${__dirname}/test_tree/bar/bar.js";`);
  })

  it("resolves original export", () => {
    const output = transform("import { baz } from 'bar';");

    expect(output).toBe(`import { bazinga as baz } from "${__dirname}/test_tree/bar/baz.js";`);
  })

  it("resolves original export", () => {
    const output = transform("import { GlobStar } from 'globstar';");

    expect(output).toBe(`import { GlobStar } from "${__dirname}/test_tree/globstar/globstar.js";`);
  })

  it("resolves modulePaths", () => {
    const output = transform("import { foo } from 'bar';");

    expect(output).toBe(`import { foo } from "${__dirname}/test_tree/bar/bar.js";`);
  })
})
