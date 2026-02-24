<template>
  <Window
    v-model="module.show"
    :title="config?.title"
    :subtitle="
      config?.subtitle +
      (config?.track > 0 ? ' | ' + t('track') + ' ' + config.track : '')
    "
    :image="config?.image ? $path.file(config.image) : ''"
    closable
    size="small"
    :flat="false"
    @close="$media.closeLyric()"
  >
    <v-skeleton-loader v-if="module.loading" type="text@5" />
    <div v-else>
      <div v-for="line in lyric" :key="line.id_lyric">
        <b v-if="line.aux_lyric">{{ line.aux_lyric }}</b>
        {{ line.lyric }}&nbsp;
      </div>
    </div>
  </Window>
</template>

<script>
import manifest from "../manifest.json";

import Window from "@/components/Window.vue";

export default {
  name: "LyricModule",
  components: {
    Window,
  },
  computed: {
    /* COMPUTEDS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    module_id() {
      return manifest.id;
    },
    module() {
      return this.$modules.get(this.module_id);
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */
    config() {
      return this.module?.config;
    },
    lyric() {
      return this.module?.data?.lyric
        ?.slice()
        .sort((a, b) => a.order - b.order);
    },
  },
  methods: {
    /* METHODS OBRIGATÓRIOS - INÍCIO */
    /* NÃO MODIFICAR */
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    /* METHODS OBRIGATÓRIOS - FIM */
  },
};
</script>
