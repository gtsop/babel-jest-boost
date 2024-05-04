const { cache } = require("./cache");

describe("cache", () => {
  it("caches function calls", () => {
    const actuallyAdd = jest.fn((a, b) => a + b);
    const actuallyRemove = jest.fn((a, b) => a - b);

    function add(a, b) {
      return actuallyAdd(a, b);
    }

    function remove(a, b) {
      return actuallyRemove(a, b);
    }

    expect(cache(add, 1, 2)).toBe(3);
    expect(cache(add, 1, 2)).toBe(3);
    expect(cache(add, 1, 2)).toBe(3);
    expect(cache(add, 1, 2)).toBe(3);
    expect(actuallyAdd).toHaveBeenCalledTimes(1);

    expect(cache(remove, 1, 2)).toBe(-1);
    expect(cache(remove, 1, 2)).toBe(-1);
    expect(cache(remove, 1, 2)).toBe(-1);
    expect(cache(remove, 1, 2)).toBe(-1);
    expect(actuallyRemove).toHaveBeenCalledTimes(1);
  });
});
