const { cacheFS, CacheFS } = require('./cache-fs');

describe.skip('CacheFS', () => {
  it('exists', () => {
    expect(CacheFS).toBeTruthy();
  });

  it('creates instances', () => {
    expect(new CacheFS('foo')).toBeInstanceOf(CacheFS);
  });

  it('sets, gets, has values', () => {
    const cache = new CacheFS('foo');

    cache.set('foo', 'bar');

    expect(cache.get('foo')).toEqual('bar');
    expect(cache.has('foo')).toBe(true);
    expect(cache.has('bar')).toBe(false);
  });
});

describe.skip('cacheFS', () => {
  it('caches function calls', () => {
    const actuallyAdd = jest.fn((a, b) => a + b);

    function add(a, b) {
      return actuallyAdd(a, b);
    }

    expect(cacheFS(add, 'a', 'b')).toBe('ab');
    expect(cacheFS(add, 'a', 'b')).toBe('ab');
    expect(cacheFS(add, 'a', 'b')).toBe('ab');
    expect(cacheFS(add, 'a', 'b')).toBe('ab');
    expect(actuallyAdd).toHaveBeenCalledTimes(1);
  });
});
