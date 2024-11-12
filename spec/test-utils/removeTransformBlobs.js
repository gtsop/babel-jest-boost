const { multilineRemove, multilineTrim } = require("./timmers");

function removeTransformBlobs(input) {
  // A list of blobs that are added post-transformation and that producing noise
  // for testing purposes
  const blobs = [
    // Use strict
    '"use strict";',
    // jest blob
    `
    function _getJestObj() {
      const {
      jest
      } = require("@jest/globals");
      _getJestObj = () => jest;
      return jest;
    }
    `,
    // Defalut interop
    `
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
    `,
    // Wildcard interop
    `
    function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
    function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
    `,
    // Polyfils
    `
    require("core-js/modules/es.symbol.js");
    require("core-js/modules/es.symbol.description.js");
    require("core-js/modules/es.symbol.iterator.js");
    require("core-js/modules/es.array.iterator.js");
    require("core-js/modules/es.object.define-property.js");
    require("core-js/modules/es.object.get-own-property-descriptor.js");
    require("core-js/modules/es.object.to-string.js");
    require("core-js/modules/es.string.iterator.js");
    require("core-js/modules/es.weak-map.js");
    require("core-js/modules/web.dom-collections.iterator.js");
    `,
    // Type of
    `
    function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
    `,
  ];

  return blobs
    .reduce((input, blob) => {
      return multilineRemove(input, multilineTrim(blob));
    }, input)
    .replace(/\/\/# sourceMappingURL.*/, "");
}

module.exports = {
  removeTransformBlobs,
};
