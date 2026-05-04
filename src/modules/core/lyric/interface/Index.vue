<template>
  <Window
    v-model="module.show"
    :title="lyConfig.title"
    :subtitle="
      lyConfig.subtitle + (lyConfig.track > 0 ? ' | ' + t('track') + ' ' + lyConfig.track : '')
    "
    :image="lyConfig.image ? lyricImageUrl : ''"
    closable
    size="small"
    @close="closeLyric()"
  >
    <v-skeleton-loader v-if="lyLoading" type="text@5" />
    <div v-else>
      <div v-for="line in lyLines" :key="line.id_lyric">
        <b v-if="line.aux_lyric">{{ line.aux_lyric }}</b>
        {{ line.lyric }}&nbsp;
      </div>
    </div>
  </Window>
</template>

<script>
import manifest from "../manifest.json";
import Window from "@/components/Window.vue";
import { useLyric } from "@/composables/useLyric";
import Modules from "@/helpers/Modules";
import UserData from "@/helpers/UserData";
import Path from "@/helpers/Path";
import Media from "@/composables/useMedia";

export default {
  name: "LyricModule",
  components: {
    Window,
  },
  setup() {
    const ly = useLyric();
    return {
      lyLoading: ly.loading,
      lyConfig: ly.config,
      lyLines: ly.lyric,
    };
  },
  computed: {
    /* COMPUTEDS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    module_id() {
      return manifest.id;
    },
    module() {
      return Modules.get(this.module_id);
    },
    userdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return UserData.get(`modules.${this.module.id}.${key}`, null);
          },
          set: (_, key, value) => {
            UserData.set(`modules.${this.module.id}.${key}`, value);
            return true;
          },
        }
      );
    },
    lyricImageUrl() {
      return this.lyConfig.image ? Path.file(this.lyConfig.image) : "";
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */
  },
  methods: {
    /* METHODS OBRIGATÓRIOS - INÍCIO */
    /* NÃO MODIFICAR */
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    /* METHODS OBRIGATÓRIOS - FIM */
    closeLyric() {
      Media.closeLyric();
    },
  },
};
</script>
