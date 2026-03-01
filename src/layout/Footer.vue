<template>
  <v-footer id="footer-bar" class="pa-0" color="primary">
    <l-player v-if="$media.isMinimized()" location="footer" />
    <v-row v-else class="ma-0 pa-0">
      <span class="text-caption pa-1">Versão {{ version }}</span>
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
}
</style>
