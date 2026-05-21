import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// https://vitejs.dev/config/
export default async ({ mode }) => {
  const { visualizer } = await import("rollup-plugin-visualizer");
  // Load app-level env vars to node-level env vars.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  // Detectar target: "desktop" (Electron) ou "web" (padrão PWA)
  const isDesktop = process.env.VITE_TARGET === "desktop";

  // CSP só em build de produção. Em dev, Vite HMR injeta inline scripts.
  // No desktop (Electron) o app carrega via file:// — `'self'` NÃO casa
  // com origem null do file:// no Chromium, então precisamos liberar
  // file: e louvorja: explicitamente. No web/PWA, mantém estrito.
  const cspExtra = isDesktop ? " file: louvorja:" : "";
  const cspMeta =
    `<meta http-equiv="Content-Security-Policy" content="` +
    `default-src 'self'${cspExtra};` +
    ` script-src 'self'${cspExtra};` +
    ` style-src 'self' 'unsafe-inline'${cspExtra} https://fonts.googleapis.com;` +
    ` font-src 'self' data:${cspExtra} https://fonts.gstatic.com;` +
    ` img-src 'self' data: https:${cspExtra};` +
    ` media-src 'self' blob: https:${cspExtra};` +
    ` connect-src 'self'${cspExtra} https://api.louvorja.com.br https://*.louvorja.com.br http://localhost:* ws://localhost:*;` +
    ` worker-src 'self'${cspExtra};` +
    `">`;

  // Plugins base — sempre incluídos
  const plugins = [
    vue(),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
    }),
    {
      name: "louvorja-csp-prod",
      apply: "build",
      transformIndexHtml(html) {
        return html.replace("<!--CSP_PROD-->", cspMeta);
      },
    },
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
    const dbUrl = process.env.VITE_URL_DATABASE ?? "";
    const filesUrl = process.env.VITE_URL_FILES ?? "";

    // Runtime caching: DB JSONs (stale-while-revalidate) + mídia (cache-first 30 dias).
    // Quando VITE_URL_* está definido, usa padrão preciso de URL; caso contrário, cai
    // em padrão por extensão (amplo mas seguro para este app de apresentação).
    const runtimeCaching = [
      // JSONs do banco — serve do cache enquanto atualiza em background
      ...(dbUrl
        ? [
            {
              urlPattern: new RegExp(`^${escapeRegex(dbUrl)}`),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "louvorja-db",
                expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 3600 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ]
        : []),
      // Áudio (mp3, ogg, wav) — cache-first, TTL 30 dias
      {
        urlPattern: filesUrl
          ? new RegExp(`^${escapeRegex(filesUrl)}.*\\.(mp3|ogg|wav)(\\?.*)?$`, "i")
          : /\.(mp3|ogg|wav)(\?.*)?$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "louvorja-audio",
          expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 3600 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Imagens externas — cache-first, TTL 30 dias
      {
        urlPattern: filesUrl
          ? new RegExp(`^${escapeRegex(filesUrl)}.*\\.(jpg|jpeg|png|webp|gif)(\\?.*)?$`, "i")
          : /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "louvorja-images",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ];

    plugins.push(
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ["**/*.{html,js,css,svg,png,woff,woff2}"],
          runtimeCaching,
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
      include: ["jszip"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@root": path.resolve(__dirname),
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
