<template>
  <Window
    v-model="module_.show"
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

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import manifest from "../manifest.json";
import Window from "@/components/Window.vue";
import { useLyric } from "@/composables/useLyric";
import Modules from "@/helpers/Modules";
import Path from "@/helpers/Path";
import Media from "@/composables/useMedia";

const { t: i18nT } = useI18n();
const moduleId = manifest.id;
const module_ = computed(() => Modules.get(moduleId));

const ly = useLyric();
const lyLoading = ly.loading;
const lyConfig = ly.config;
const lyLines = ly.lyric;

const lyricImageUrl = computed(() =>
  lyConfig.value?.image ? Path.file(lyConfig.value.image) : ""
);

const t = (text) => i18nT(`modules.${moduleId}.${text}`);

function closeLyric() {
  Media.closeLyric();
}
</script>
