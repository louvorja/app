<template>
  <Window
    v-model="module.show"
    :title="config?.title"
    :subtitle="
      config?.subtitle +
      (config?.track > 0 ? ' | ' + t('general.track') + ' ' + config.track : '')
    "
    :image="config?.image ? $path.file(config.image) : ''"
    title-class="text-h4 font-weight-light"
    closable
    minimizable
    compact
    compact_footer
    @close="$media.close()"
    @minimize="$media.minimize()"
    @resize="resize"
    size="large"
    :scrollPos="scrollPos"
    dark
  >
    <template v-slot:system_buttons>
      <v-menu v-if="is_online">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            class="ms-2"
            icon="mdi-menu"
            variant="text"
            size="small"
          />
        </template>
        <v-card>
          <v-card-text>
            <v-tooltip :text="t('inputs.lazy_load_tooltip')">
              <template v-slot:activator="{ props }">
                <v-switch
                  color="blue"
                  v-bind="props"
                  v-model="lazy_load"
                  :label="t('inputs.lazy_load')"
                />
              </template>
            </v-tooltip>
            <v-tooltip :text="t('inputs.fade_audio_tooltip')">
              <template v-slot:activator="{ props }">
                <v-switch
                  color="blue"
                  v-bind="props"
                  v-model="fade_audio"
                  :label="t('inputs.fade_audio')"
                />
              </template>
            </v-tooltip>
          </v-card-text>
        </v-card>
      </v-menu>
    </template>

    <div
      class="d-flex flex-no-wrap align-stretch flex-row justify-space-between"
    >
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
            :image="slide.url_image ? $path.file(slide.url_image) : null"
            :image_position="slide.image_position"
          />
          <l-fullscreen-player v-if="fullscreen" />
        </fullscreen>
      </div>
      <div v-if="$vuetify.display.width > 600">
        <v-list class="overflow h-100 ma-0 pa-0" bg-color="black" :width="250">
          <v-list-item
            @click="$media.goToSlide(index)"
            v-for="(item, index) in slides"
            :key="index"
            link
            :active="config.slide_index === index"
            ref="slideItem"
            variant="tonal"
            :height="58"
          >
            <template v-slot:prepend>
              <v-chip class="mr-2">{{ index + 1 }}</v-chip>
            </template>

            <v-list-item-title v-if="item.cover">
              {{ item.lyric }}
            </v-list-item-title>
            <div
              class="text-caption text-truncate"
              v-else
              v-html="item.lyric"
            />
            <v-progress-linear
              v-if="config.audio != '' && config.slide_index == index"
              v-model="config.slide_progress"
              :indeterminate="loading"
              :height="5"
              :color="config.is_paused ? 'orange' : 'white'"
            />

            <img
              v-if="item.url_image"
              :src="$path.file(item.url_image)"
              style="display: none"
            />
          </v-list-item>
        </v-list>
      </div>
    </div>

    <template v-slot:footer>
      <l-player location="window" />
    </template>
  </Window>
</template>

<script>
import manifest from "../manifest.json";

import Window from "@/components/Window.vue";

import LSlide from "@/components/Slide.vue";
import LPlayer from "@/components/Player.vue";
import LFullscreenPlayer from "@/components/FullscreenPlayer.vue";

export default {
  name: "MediaComponent",
  components: {
    Window,
    LSlide,
    LPlayer,
    LFullscreenPlayer,
  },
  data: () => ({
    preview_height: 0,
    scrollPos: 0,
  }),
  computed: {
    /* COMPUTEDS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    module_id() {
      return manifest.id;
    },
    module() {
      return this.$modules.get(this.module_id);
    },
    userdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return this.$userdata.get(`modules.${this.module.id}.${key}`, null);
          },
          set: (_, key, value) => {
            this.$userdata.set(`modules.${this.module.id}.${key}`, value);
            return true;
          },
        },
      );
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */
    is_online() {
      return this.$appdata.get("is_online");
    },
    loading() {
      return this.module.loading;
    },
    config() {
      return this.$media.config();
    },
    slide_index() {
      return this.config?.slide_index;
    },
    slides() {
      return this.$media.slides();
    },
    slide() {
      return this.$media.slide();
    },
    fullscreen: {
      get() {
        return this.module.config.fullscreen;
      },
      set(value) {
        this.$media.fullscreen(value);
      },
    },
    lazy_load: {
      get() {
        return this.$userdata.get("modules.media.lazy_load");
      },
      set(value) {
        this.$userdata.set("modules.media.lazy_load", value);
      },
    },
    fade_audio: {
      get() {
        return this.$userdata.get("modules.media.fade_audio");
      },
      set(value) {
        this.$userdata.set("modules.media.fade_audio", value);
      },
    },
  },
  watch: {
    slide_index() {
      if (!this.module.show) {
        return;
      }

      if (this.$refs?.slideItem && this.$refs?.slideItem[0]?.$el) {
        let self = this;
        let height = this.$refs.slideItem[0].$el.offsetHeight;
        setTimeout(function () {
          self.scrollPos = self.slide_index * height - height;
        }, 100);
      }
    },
  },
  methods: {
    /* METHODS OBRIGATÓRIOS - INÍCIO */
    /* NÃO MODIFICAR */
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    /* METHODS OBRIGATÓRIOS - FIM */
    resize(data) {
      this.preview_height = data.container_height;
    },
  },
};
</script>
