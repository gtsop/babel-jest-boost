import globals from "globals";
import pluginJs from "@eslint/js";
import eslintPluginJest from "eslint-plugin-jest";

export default [
  {
    plugins: {
      eslintPluginJest
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      }
    }
  },
  pluginJs.configs.recommended,
];
