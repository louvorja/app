import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "*.local.js",
      "*.config.js",
      "node/",
      "src/modules/animation/dependencies/",
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        anime: "readonly",
      },
    },
    rules: {},
  },
];