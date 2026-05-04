import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default async ({ mode }) => {
  const { visualizer } = await import("rollup-plugin-visualizer");
  // Load app-level env vars to node-level env vars.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  // Detectar target: "desktop" (Electron) ou "web" (padrão PWA)
  const isDesktop = process.env.VITE_TARGET === "desktop";

  // Plugins base — sempre incluídos
  const plugins = [
    vue(),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
    }),
  ];

  // Bundle visualizer — gera dist/stats.html a cada build
  plugins.push(
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  );

  // VitePWA só para target web — no Electron o protocolo file:// não suporta Service Workers
  if (!isDesktop) {
    plugins.push(
      VitePWA({
        registerType: "autoUpdate", // Registra o Service Worker para atualizar automaticamente
        devOptions: {
          enabled: true, // Ativa o PWA também durante o desenvolvimento
        },
        workbox: {
          globPatterns: ["**/*.{html,js,css,svg,png}"], // Arquivos que o Service Worker deve cachear
        },
        manifest: {
          name: "LouvorJA",
          short_name: "LouvorJA",
          description: "Software de músicas para Louvor e Adoração",
          start_url: process.env.VITE_BASE_URL ?? "/",
          display: "standalone",
          background_color: "#000000",
          theme_color: "#000000",
          icons: [
            {
              src: (process.env.VITE_BASE_URL ?? "/") + "ico/favicon-16x16.png",
              sizes: "16x16",
              type: "image/png",
            },
            {
              src: (process.env.VITE_BASE_URL ?? "/") + "ico/favicon-32x32.png",
              sizes: "32x32",
              type: "image/png",
            },
            {
              src: (process.env.VITE_BASE_URL ?? "/") + "ico/favicon-144x144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: (process.env.VITE_BASE_URL ?? "/") + "ico/favicon-152x152.png",
              sizes: "152x152",
              type: "image/png",
            },
            {
              src: (process.env.VITE_BASE_URL ?? "/") + "ico/favicon-180x180.png",
              sizes: "180x180",
              type: "image/png",
            },
          ],
        },
      })
    );
  }

  return defineConfig({
    // No Electron, base deve ser "./" para que assets relativos funcionem via file://
    // No web/PWA, usa VITE_BASE_URL ou "/" como padrão
    base: isDesktop ? "./" : (process.env.VITE_BASE_URL ?? "/"),

    plugins,

    define: {
      "process.env": {},
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "true",
    },
    optimizeDeps: {
      exclude: ["jszip"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@helpers": path.resolve(__dirname, "src/helpers"),
        "@components": path.resolve(__dirname, "src/components"),
        "@modules": path.resolve(__dirname, "src/modules"),
        "@layout": path.resolve(__dirname, "src/layout"),
        "@views": path.resolve(__dirname, "src/views"),
        "@store": path.resolve(__dirname, "src/store"),
        "@lang": path.resolve(__dirname, "src/lang"),
      },
    },
    build: {
      rollupOptions: {
        // jszip é uma dependência opcional (necessária apenas para loadSlja).
        // Marcada como external para não falhar o build quando não está instalada.
        // Instalar com: npm install jszip
        external: ["jszip"],
        output: {
          manualChunks: {
            // Framework core — raramente muda, longa vida no cache do browser
            "vendor-vue": ["vue", "vue-router", "pinia"],
            // i18n — muda só com novas traduções
            "vendor-i18n": ["vue-i18n"],
            // Busca full-text
            "vendor-fuse": ["fuse.js"],
            // Vuetify NÃO entra aqui — vite-plugin-vuetify faz tree-shaking
            // automático dos componentes; forçar um chunk único quebraria isso.
          },
        },
      },
    },
    server: {
      port: 5002,
    },
    /* remove the need to specify .vue files https://vitejs.dev/config/#resolve-extensions
  resolve: {
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ]
  },
  */
  });
};
