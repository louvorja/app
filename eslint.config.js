import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";

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
        browser: true,
        node: true,
        es2021: true,
        anime: "readonly",
      },
    },
    rules: {},
  },
];