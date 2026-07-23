<template>
  <v-footer
    v-if="!isMobile || $media.isMinimized()"
    id="footer-bar"
    class="pa-0"
    color="primary"
    :class="{ 'lj-footer--above-nav': isMobile }"
  >
    <l-player v-if="$media.isMinimized()" location="footer" />
    <v-row v-else class="ma-0 pa-0 align-center">
      <span class="text-caption pa-1">Versão {{ version }}</span>
      <v-spacer />
      <a
        href="https://allananjos.dev.br"
        target="_blank"
        rel="noopener noreferrer"
        class="text-caption pa-1 lj-credit-link"
      >
        Adaptado por Allan Anjos
      </a>
    </v-row>
  </v-footer>
</template>

<script>
import packageJson from "../../package.json";

import LPlayer from "@/components/Player.vue";

export default {
  name: "FooterLayout",
  components: {
    LPlayer,
  },
  data: () => ({
    db_version: 0,
  }),
  computed: {
    isMobile() {
      return this.$vuetify.display.width <= 600;
    },
    version() {
      return packageJson.version + "." + this.db_version;
    },
  },
  methods: {
    async loadDBVersion() {
      const config = await this.$database.get("config");
      this.db_version = config.version_number;
    },
  },
  async mounted() {
    await this.loadDBVersion();
  },
};
</script>

<style scoped>
#footer-bar {
  flex: 0 !important;
  padding-bottom: var(--safe-bottom);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
  flex-wrap: wrap;
}

/* No mobile, a barra de navegação inferior é fixa por baixo — o rodapé
   (player minimizado) precisa ficar acima dela, não por baixo. */
.lj-footer--above-nav {
  padding-bottom: 0;
  margin-bottom: calc(56px + var(--safe-bottom));
}

.lj-credit-link {
  color: inherit;
  text-decoration: none;
  opacity: 0.85;
}

.lj-credit-link:hover {
  opacity: 1;
  text-decoration: underline;
}
</style>
