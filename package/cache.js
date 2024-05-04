const caches = new Map();
const md5 = require("md5");

function getCache(name) {
  if (caches.has(name)) return caches.get(name);
  caches.set(name, new Map());
  return caches.get(name);
}

function cache(func, ...params) {
  const map = getCache(func.name);
  const cacheKey = params.join("-");

  if (map.has(cacheKey)) {
    return map.get(cacheKey);
  }
  const result = func.apply(null, params);

  map.set(cacheKey, result);
  return map.get(cacheKey);
}

function withCache(func) {
  const map = getCache(func.name);
  return function funcWithCache(...params) {
    // const cacheKey = params.join('-');
    const cacheKey = md5(params.join("-"));
    if (map.has(cacheKey)) {
      return map.get(cacheKey);
    }
    const result = func.apply(null, params);

    // console.log('creating cache key', cacheKey);
    map.set(cacheKey, result);
    return result;
  };
}

module.exports = { cache, withCache };
