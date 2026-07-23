import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// Reproduz localmente (só em "vite dev") as rotas /api/egw/* que em
// produção são funções serverless da Vercel — assim dá pra testar a
// integração com a EGW Writings API sem precisar do Vercel CLI.
function egwApiDevMiddleware() {
  return {
    name: "egw-api-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith("/api/egw/")) {
          next();
          return;
        }

        try {
          const url = new URL(req.url, "http://localhost");
          const action = url.pathname.replace("/api/egw/", "").split("/")[0];
          const query = Object.fromEntries(url.searchParams.entries());
          const core = await import("./api/egw/_core.js");

          let data;
          if (action == "books") {
            data = await core.listBooks({
              lang: query.lang,
              limit: query.limit ? Number(query.limit) : undefined,
              page: query.page,
            });
          } else if (action == "toc") {
            data = await core.getBookToc(query.bookId);
          } else if (action == "chapter") {
            data = await core.getChapter(query.bookId, query.para);
          } else if (action == "search") {
            data = await core.search({
              query: query.query,
              lang: query.lang,
              limit: query.limit ? Number(query.limit) : undefined,
              offset: query.offset ? Number(query.offset) : undefined,
            });
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Rota /api/egw desconhecida" }));
            return;
          }

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (err) {
          res.statusCode = err.status || 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default ({ mode }) => {
  // Load app-level env vars to node-level env vars. Prefixo vazio para
  // também carregar variáveis sem VITE_ (ex: EGW_CLIENT_ID/SECRET), que
  // devem ficar disponíveis só no processo Node (dev server / funções
  // serverless) e nunca no bundle do navegador — isso é garantido pelo
  // "define: { 'process.env': {} }" logo abaixo, que zera process.env
  // no código do cliente.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return defineConfig({
    base: process.env.VITE_BASE_URL ?? "/",
    plugins: [
      vue(),
      egwApiDevMiddleware(),
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
      vuetify({
        autoImport: true,
      }),
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
          display_override: ["standalone", "fullscreen"],
          orientation: "any",
          background_color: "#003366",
          theme_color: "#003366",
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
              src:
                (process.env.VITE_BASE_URL ?? "/") + "ico/favicon-144x144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src:
                (process.env.VITE_BASE_URL ?? "/") + "ico/favicon-152x152.png",
              sizes: "152x152",
              type: "image/png",
            },
            {
              src:
                (process.env.VITE_BASE_URL ?? "/") + "ico/favicon-180x180.png",
              sizes: "180x180",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    define: {
      "process.env": {},
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "true",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
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
