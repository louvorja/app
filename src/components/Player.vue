<template>
  <v-card theme="dark" class="w-100 pa-0 ma-0 d-flex align-center" :rounded="0">
    <div
      v-if="location == 'footer' && $vuetify.display.width > 800"
      class="d-flex align-center"
      :style="
        media.config.image && $vuetify.display.width > 900
          ? 'max-width: 350px;padding-right:50px;'
          : 'max-width: 300px'
      "
    >
      <v-avatar
        v-if="media.config.image && $vuetify.display.width > 900"
        class="ma-1"
        size="65"
        rounded="0"
      >
        <v-img :src="$path.file(media.config.image)" />
      </v-avatar>
      <div class="d-flex flex-column flex-grow-1 w-100">
        <v-card-title class="py-0">
          {{ media.config.title }}
        </v-card-title>
        <v-card-subtitle v-if="media.config.subtitle" class="py-0">
          {{ media.config.subtitle }}
          <span v-if="media.config.track > 0">
            | {{ $t("modules.media.general.track") }} {{ media.config.track }}
          </span>
        </v-card-subtitle>
      </div>
    </div>

    <div class="d-flex flex-column flex-grow-1">
      <div class="d-flex align-center justify-center py-1 flex-grow-1">
        <v-btn
          v-for="(button, key) in buttons"
          v-show="button.show && (compact === false || (compact === true && !button.compact))"
          :key="key"
          v-shortkey="button.shortkey"
          :disabled="media.loading || button.disabled"
          :icon="button.icon"
          :color="button.highlight ? 'white' : ''"
          :variant="button.highlight ? 'flat' : 'text'"
          class="ma-1"
          size="small"
          @click="button.click"
          @shortkey="button.click"
        />
      </div>
      <div v-if="media.config.audio" class="d-flex align-center justify-center py-1 px-3">
        <div class="text-right text-caption">
          {{ $datetime.shortTime(audio.currentTime) }}
        </div>
        <div class="flex-grow-1 px-2">
          <v-progress-linear
            v-model="audio.progress"
            rounded
            clickable
            :indeterminate="media.loading"
            :height="10"
            :buffer-value="audio.buffered"
            :color="audio.isPaused ? 'warning' : audio.volume <= 0 ? 'red' : 'info'"
            @click="changeProgress"
          />
        </div>
        <div class="text-left text-caption">
          {{ $datetime.shortTime(audio.duration) }}
        </div>
        <div
          v-if="media.config.last_slide > 0"
          class="text-caption text-medium-emphasis ml-2"
          style="white-space: nowrap"
        >
          {{ media.config.slide_index + 1 }}/{{ media.config.last_slide }}
        </div>
      </div>
      <div
        v-if="!media.config.audio && location == 'footer'"
        class="d-flex align-center justify-center py-1 px-3"
      >
        <small class="text-center">
          {{ slide_text }}
        </small>
      </div>
    </div>
    <div class="d-flex flex-column">
      <div class="d-flex align-center justify-end pa-1 flex-grow-1">
        <v-menu v-if="location !== 'fullscreen' && $vuetify.display.width > 350">
          <template #activator="{ props }">
            <v-btn
              variant="text"
              size="small"
              :color="mode.color"
              v-bind="props"
              :icon="mode.tray_icon"
            />
          </template>

          <v-list>
            <template v-for="(mode, key) in menu_modes" :key="key">
              <v-divider v-if="mode.title == '-'" />
              <v-list-item
                v-else
                :active="mode.active"
                :disabled="mode.disabled"
                @click="mode.click"
              >
                <template #prepend>
                  <v-icon :icon="mode.icon"></v-icon>
                </template>
                {{ mode.title }}
              </v-list-item>
            </template>
          </v-list>
        </v-menu>

        <v-menu v-if="media.minimized && !compact">
          <template #activator="{ props }">
            <v-btn variant="flat" size="x-small" color="white" v-bind="props">
              {{ media.config.slide_index + 1 }}
            </v-btn>
          </template>

          <v-list>
            <v-list-item
              v-for="(item, index) in slides"
              :key="index"
              :active="media.config.slide_index == index"
              @click="$media.goToSlide(index)"
            >
              <template #prepend>
                <v-chip size="small" class="mr-2">{{ index + 1 }}</v-chip>
              </template>

              <v-list-item-title v-if="item.cover">
                {{ item.lyric }}
              </v-list-item-title>
              <div v-else class="text-caption text-truncate" v-html="item.lyric" />
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn
          v-if="media.minimized"
          variant="text"
          size="small"
          icon="mdi-open-in-app"
          @click="maximize()"
        />
        <v-btn
          v-if="location == 'fullscreen'"
          variant="text"
          size="small"
          icon="mdi-fullscreen-exit"
          @click="fullscreen(false)"
        />
        <v-btn
          v-else-if="location == 'window'"
          variant="text"
          size="small"
          icon="mdi-fullscreen"
          @click="fullscreen()"
        />
        <LScreenBtn v-if="location !== 'fullscreen'" module="media" />

        <v-menu v-if="location !== 'fullscreen' && compact">
          <template #activator="{ props }">
            <v-btn icon="mdi-menu" variant="text" size="small" v-bind="props"></v-btn>
          </template>

          <v-list>
            <v-list-item
              v-for="(button, key) in buttons.filter((item) => item.compact == true)"
              :key="key"
              v-shortkey="button.shortkey"
              :disabled="media.loading || button.disabled"
              @click="button.click"
              @shortkey="button.click"
            >
              <v-icon :icon="button.icon" />
            </v-list-item>

            <v-divider v-if="$vuetify.display.width <= 350" />
            <template v-for="(mode, key) in menu_modes" :key="key">
              <v-divider v-if="mode.title == '-' && $vuetify.display.width <= 350" />
              <v-list-item
                v-else-if="$vuetify.display.width <= 350"
                :active="mode.active"
                :disabled="mode.disabled"
                @click="mode.click"
              >
                <v-icon :icon="mode.icon" />
              </v-list-item>
            </template>
          </v-list>
        </v-menu>

        <v-btn
          v-if="media.minimized"
          variant="text"
          size="small"
          icon="mdi-close"
          @click="close()"
        />
      </div>
      <div v-if="media.config.audio" class="d-flex align-center justify-center pa-1">
        <div>
          <v-btn
            :disabled="media.loading"
            :icon="volume_icon"
            size="x-small"
            variant="text"
            @click="toogleVolume"
          />
        </div>
        <div class="flex-grow-1 px-2" style="min-width: 100px">
          <v-progress-linear
            v-model="audio.volume"
            rounded
            clickable
            :height="10"
            color="white"
            @click="changeVolume"
          />
        </div>
      </div>
    </div>
  </v-card>
</template>

<script>
import LScreenBtn from "@/components/buttons/Screen.vue";
import { useAudioPlayback } from "@/composables/useAudioPlayback";

export default {
  name: "PlayerComponent",
  components: {
    LScreenBtn,
  },
  props: {
    location: String,
  },
  setup() {
    return { audio: useAudioPlayback() };
  },
  computed: {
    media() {
      return this.$modules.get("media");
    },
    slides() {
      return this.$media.slides();
    },
    has_instrumental_music() {
      return this.media.data.url_instrumental_music ? true : false;
    },
    buttons() {
      return [
        // Atalhos centralizados em Hotkeys.js (Space, Home, End, Ctrl+↑/↓/PageUp/PageDown).
        // Aqui só o clique no botão. ArrowLeft/ArrowRight simples permanecem locais
        // (não estão no Hotkeys.js para não conflitar com a navegação de listas).
        {
          show: this.media.config.audio,
          compact: true,
          disabled: false,
          highlight: false,
          icon: "mdi-rewind-10",
          click: () => this.rewind(),
        },
        {
          show: true,
          compact: true,
          disabled: this.media.config.slide_index <= 0,
          highlight: false,
          icon: "mdi-page-first",
          click: () => this.first(),
        },
        {
          show: true,
          compact: false,
          disabled: this.media.config.slide_index <= 0,
          highlight: false,
          icon: "mdi-chevron-left",
          click: () => this.prev(),
          shortkey: ["arrowleft"],
        },
        {
          show: this.media.config.audio,
          compact: false,
          disabled: this.audio.isFading,
          highlight: true,
          icon: this.audio.isPaused ? "mdi-play" : "mdi-pause",
          click: () => this.play(),
        },
        {
          show: true,
          compact: false,
          disabled: this.media.config.slide_index >= this.media.config.last_slide - 1,
          highlight: false,
          icon: "mdi-chevron-right",
          click: () => this.next(),
          shortkey: ["arrowright"],
        },
        {
          show: true,
          compact: true,
          disabled: this.media.config.slide_index >= this.media.config.last_slide - 1,
          highlight: false,
          icon: "mdi-page-last",
          click: () => this.last(),
        },
        {
          show: this.media.config.audio,
          compact: true,
          disabled: false,
          highlight: false,
          icon: "mdi-fast-forward-10",
          click: () => this.forward(),
        },
      ];
    },
    menu_modes() {
      return [
        {
          mode: "audio",
          title: this.$t("modules.media.general.sung"),
          color: "info",
          active: this.media.config.mode == "audio",
          icon: "mdi-play-box-multiple",
          tray_icon: "mdi-account-voice",
          click: () =>
            this.open({
              id_music: this.media.id_music,
              mode: "audio",
              minimized: this.media.minimized,
            }),
        },
        {
          mode: "instrumental",
          title: this.$t("modules.media.general.instrumental"),
          color: "success",
          active: this.media.config.mode == "instrumental",
          disabled: !this.has_instrumental_music,
          icon: "mdi-play-box-multiple-outline",
          tray_icon: "mdi-music-note",
          click: () =>
            this.open({
              id_music: this.media.id_music,
              mode: "instrumental",
              minimized: this.media.minimized,
            }),
        },
        {
          mode: "no_audio",
          title: this.$t("modules.media.general.no_audio"),
          color: "error",
          active: this.media.config.mode == "no_audio",
          icon: "mdi-checkbox-multiple-blank-outline",
          tray_icon: "mdi-music-off",
          click: () =>
            this.open({
              id_music: this.media.id_music,
              minimized: this.media.minimized,
            }),
        },
        { title: "-" },
        {
          title: this.$t("modules.media.general.lyric"),
          color: "error",
          icon: "mdi-text-box-outline",
          click: () => this.openLyric(),
        },
      ];
    },
    mode() {
      return this.menu_modes.filter((item) => item.mode == this.media.config.mode)[0];
    },
    volume_icon: function () {
      switch (true) {
        case this.audio.volume <= 0:
          return "mdi-volume-mute";
        case this.audio.volume <= 20:
          return "mdi-volume-low";
        case this.audio.volume <= 70:
          return "mdi-volume-medium";
        default:
          return "mdi-volume-high";
      }
    },
    slide_text: function () {
      if (!this.slides[this.media.config.slide_index]) return "";
      if (!this.slides[this.media.config.slide_index].lyric) return "";

      let text = this.slides[this.media.config.slide_index].lyric;
      text = text.replace(/<br>/gi, " / ").toUpperCase();
      return text;
    },
    is_mobile: function () {
      return this.$appdata.get("is_mobile");
    },
    compact: function () {
      return this.$vuetify.display.width <= 500;
    },
  },
  methods: {
    play() {
      if (this.audio.isPaused) {
        this.$media.play();
      } else {
        this.$media.pause();
      }
    },
    rewind: function () {
      this.$media.advanceTime(-10);
    },
    first() {
      this.$media.firstSlide();
    },
    prev() {
      this.$media.prevSlide();
    },
    next() {
      this.$media.nextSlide();
    },
    last() {
      this.$media.lastSlide();
    },
    forward: function () {
      this.$media.advanceTime(+10);
    },
    open: function (data) {
      this.$media.open(data);
    },
    openLyric: function () {
      this.$media.openLyric();
    },
    maximize: function () {
      this.$media.maximize();
    },
    close: function () {
      this.$media.close();
    },
    changeProgress() {
      const time = (this.audio.duration * this.audio.progress) / 100;
      this.$media.goToTime(time);
    },
    fullscreen(value = true) {
      this.$media.fullscreen(value);
    },
    toogleVolume() {
      this.$media.toogleVolume();
    },
    changeVolume() {
      this.$media.setVolume(this.audio.volume);
    },
  },
};
</script>
