import globals from "globals";
import pluginJs from "@eslint/js";
import eslintPluginJest from "eslint-plugin-jest";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    plugins: {
      eslintPluginJest,
      eslintConfigPrettier,
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  pluginJs.configs.recommended,
];
