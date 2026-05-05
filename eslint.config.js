import pluginVue from "eslint-plugin-vue";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    // Vue SFCs: vue-eslint-parser como parser principal,
    // @typescript-eslint/parser delegado para blocos <script lang="ts">
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    // Arquivos .ts puros: usar diretamente o parser TS
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
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
      // Imports cruzando 2+ níveis devem usar alias (@/helpers/X) — nunca ../../
      "no-restricted-imports": ["error", { patterns: ["../../*"] }],
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
    // Node.js config files e scripts
    files: [
      "vite.config.js",
      "babel.config.js",
      "playwright.config.js",
      "vitest.config.js",
      "scripts/**/*.mjs",
      "scripts/**/*.js",
    ],
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
      "coverage/**",
      "node/**",
      "src/modules/animation/dependencies/**",
      "electron/**",
    ],
  },
  eslintConfigPrettier,
];
