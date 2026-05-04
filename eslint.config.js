import pluginVue from "eslint-plugin-vue";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "warn",
      "vue/no-unused-vars": "error",
      "vue/html-self-closing": [
        "warn",
        { html: { void: "always", normal: "always", component: "always" } },
      ],

      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      radix: "error",
    },
  },
  {
    // Componentes da shell: multi-word obrigatório, com ignores para nomes single-word
    // consagrados que não colidem com HTML nativo.
    files: ["src/components/**/*.vue", "src/layout/**/*.vue"],
    rules: {
      "vue/multi-word-component-names": [
        "warn",
        {
          ignores: [
            "Alert",
            "Footer",
            "Loading",
            "Modules",
            "Player",
            "Screen",
            "Slide",
            "Toolbar",
            "Window",
          ],
        },
      ],
    },
  },
  {
    // Node.js config files
    files: ["vite.config.js", "babel.config.js", "playwright.config.js", "vitest.config.js"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
      },
    },
  },
  {
    // Módulo animation usa anime.js como global injetado via CDN
    files: ["src/modules/animation/**/*.vue", "src/modules/animation/**/*.js"],
    languageOptions: {
      globals: { anime: "readonly" },
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "dev-dist/**",
      "node/**",
      "src/modules/animation/dependencies/**",
      "electron/**",
    ],
  },
  eslintConfigPrettier,
];
