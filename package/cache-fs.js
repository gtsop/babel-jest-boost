const os = require("os");
const path = require("path");
const fs = require("fs");
const md5 = require("md5");

const caches = new Map();

function syncSleep(interval = 10) {
  const endTime = new Date().getTime() + interval;
  while (new Date().getTime() < endTime) {
    // Wait
  }
}

class CacheFS {
  name = "";

  cacheDir = "";

  constructor(name) {
    this.name = name;
    // this.cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), `/jest_rs/${name}-`));
    this.cacheDir = path.join(os.tmpdir(), `/jest_rs/${name}`);
    // this.interCache = new Map();
    fs.mkdirSync(this.cacheDir, { recursive: true });

    // fs.readdirSync(this.cacheDir).forEach((file) => {
    //   this.interCache.set(file, true);
    // });
  }

  has(key) {
    // return this.interCache.has(key);
    return fs.existsSync(`${this.cacheDir}/${key}`);
  }

  get(key) {
    return JSON.parse(fs.readFileSync(`${this.cacheDir}/${key}`, "utf8"));
  }

  set(key, value) {
    // this.interCache.set(key, true);
    return fs.writeFileSync(`${this.cacheDir}/${key}`, JSON.stringify(value));
  }
}

function getCache(name) {
  if (caches.has(name)) return caches.get(name);
  caches.set(name, new CacheFS(name));
  return caches.get(name);
}

function cacheFS(func, ...params) {
  const map = getCache(func.name);
  const cacheKey = md5(params.join("-"));

  if (map.has(cacheKey)) {
    return map.get(cacheKey);
  }
  const result = func.apply(null, params);

  map.set(cacheKey, result);
  return map.get(cacheKey);
}

function withCacheFS(func) {
  const map = getCache(func.name);
  return function funcWithCacheFS(...params) {
    try {
      const cacheKey = md5(params.join("-"));
      // console.log('cachefs', cacheKey);
      if (map.has(cacheKey)) {
        return map.get(cacheKey);
      }

      const result = func.apply(null, params);

      map.set(cacheKey, result);
      return map.get(cacheKey);
    } catch (e) {
      // some collision probably happened here, will proceed to retry
      console.log("================ colision? syncSleeping", e);
      syncSleep();
      return funcWithCacheFS(...params);
    }
  };
}

module.exports = { cacheFS, withCacheFS, CacheFS };
