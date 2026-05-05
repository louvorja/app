<template>
  <Window
    v-model="module_.show"
    :title="config?.title"
    :subtitle="
      config?.subtitle + (config?.track > 0 ? ' | ' + t('general.track') + ' ' + config.track : '')
    "
    :image="config?.image ? pathFile(config.image) : ''"
    title-class="text-h4 font-weight-light"
    closable
    minimizable
    compact
    compact_footer
    size="large"
    :scroll-pos="scrollPos"
    dark
    @close="closeMedia()"
    @minimize="minimizeMedia()"
    @resize="resize"
  >
    <template #system_buttons>
      <v-menu v-if="is_online">
        <template #activator="{ props }">
          <v-btn v-bind="props" class="ms-2" icon="mdi-menu" variant="text" size="small" />
        </template>
        <v-card>
          <v-card-text>
            <v-tooltip :text="t('inputs.lazy_load_tooltip')">
              <template #activator="{ props }">
                <v-switch
                  v-bind="props"
                  v-model="lazy_load"
                  color="blue"
                  :label="t('inputs.lazy_load')"
                />
              </template>
            </v-tooltip>
            <v-tooltip :text="t('inputs.fade_audio_tooltip')">
              <template #activator="{ props }">
                <v-switch
                  v-bind="props"
                  v-model="fade_audio"
                  color="blue"
                  :label="t('inputs.fade_audio')"
                />
              </template>
            </v-tooltip>
          </v-card-text>
        </v-card>
      </v-menu>
    </template>

    <div class="d-flex flex-no-wrap align-stretch flex-row justify-space-between">
      <div class="w-100">
        <fullscreen
          v-model="fullscreen"
          class="position-sticky w-100"
          :style="`top: 0; height:${preview_height}px; overflow: hidden;`"
        >
          <l-slide
            v-if="slide"
            :slide_number="config.slide_index"
            :cover="slide.cover == true"
            :text="slide.lyric"
            :aux_text="slide.aux_lyric"
            :image="slide.url_image ? pathFile(slide.url_image) : null"
            :image_position="slide.image_position"
          />
          <l-fullscreen-player v-if="fullscreen" />
        </fullscreen>
      </div>
      <div v-if="width > 600">
        <v-list class="overflow h-100 ma-0 pa-0" bg-color="black" :width="250">
          <v-list-item
            v-for="(item, index) in slides"
            :key="index"
            ref="slideItem"
            link
            :active="config.slide_index === index"
            variant="tonal"
            :height="58"
            @click="goToSlide(index)"
          >
            <template #prepend>
              <v-chip class="mr-2">{{ index + 1 }}</v-chip>
            </template>

            <v-list-item-title v-if="item.cover">
              {{ item.lyric }}
            </v-list-item-title>
            <div v-else class="text-caption text-truncate" v-html="item.lyric" />
            <v-progress-linear
              v-if="config.audio != '' && config.slide_index == index"
              v-model="config.slide_progress"
              :indeterminate="loading"
              :height="5"
              :color="config.is_paused ? 'orange' : 'white'"
            />

            <img
              v-if="item.url_image"
              :src="pathFile(item.url_image)"
              alt=""
              style="display: none"
            />
          </v-list-item>
        </v-list>
      </div>
    </div>

    <template #footer>
      <l-player location="window" />
    </template>
  </Window>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import manifest from "../manifest.json";
import Window from "@/components/Window.vue";
import LSlide from "@/components/Slide.vue";
import LPlayer from "@/components/Player.vue";
import LFullscreenPlayer from "@/components/FullscreenPlayer.vue";
import Modules from "@/helpers/Modules";
import UserData from "@/helpers/UserData";
import AppData from "@/helpers/AppData";
import Media from "@/composables/useMedia";
import Path from "@/helpers/Path";

const { t: i18nT } = useI18n();
const { width } = useDisplay();
const moduleId = manifest.id;
const module_ = computed(() => Modules.get(moduleId));

const preview_height = ref(0);
const scrollPos = ref(0);
const slideItem = ref(null);

const t = (text) => i18nT(`modules.${moduleId}.${text}`);

const is_online = computed(() => AppData.get("is_online"));
const loading = computed(() => module_.value.loading);
const config = computed(() => Media.config());
const slide_index = computed(() => config.value?.slide_index);
const slides = computed(() => Media.slides());
const slide = computed(() => Media.slide());

const fullscreen = computed({
  get: () => module_.value.config?.fullscreen,
  set: (value) => Media.fullscreen(value),
});

const lazy_load = computed({
  get: () => UserData.get("modules.media.lazy_load"),
  set: (value) => UserData.set("modules.media.lazy_load", value),
});

const fade_audio = computed({
  get: () => UserData.get("modules.media.fade_audio"),
  set: (value) => UserData.set("modules.media.fade_audio", value),
});

watch(slide_index, () => {
  if (!module_.value.show) return;
  const items = slideItem.value;
  if (items && items[0]?.$el) {
    const height = items[0].$el.offsetHeight;
    setTimeout(() => {
      scrollPos.value = slide_index.value * height - height;
    }, 100);
  }
});

function pathFile(img) {
  return Path.file(img);
}

function closeMedia() {
  Media.close();
}

function minimizeMedia() {
  Media.minimize();
}

function goToSlide(index) {
  Media.goToSlide(index);
}

function resize(data) {
  preview_height.value = data.container_height;
}
</script>
