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
      <PlayerControls :buttons="buttons" :compact="compact" :loading="media.loading" />
      <PlayerProgress
        v-if="media.config.audio"
        :progress="audio.progress"
        :current-time="audio.currentTime"
        :duration="audio.duration"
        :buffered="audio.buffered"
        :loading="media.loading"
        :is-paused="audio.isPaused"
        :volume="audio.volume"
        :slide-index="media.config.slide_index"
        :last-slide="media.config.last_slide"
        @seek="seekToProgress"
      />
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
            <template v-for="(item, key) in menu_modes" :key="key">
              <v-divider v-if="item.title == '-'" />
              <v-list-item
                v-else
                :active="item.active"
                :disabled="item.disabled"
                @click="item.click"
              >
                <template #prepend>
                  <v-icon :icon="item.icon"></v-icon>
                </template>
                {{ item.title }}
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
              @click="goToSlide(index)"
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
              v-for="(button, key) in compactButtons"
              :key="key"
              v-shortkey="button.shortkey"
              :disabled="media.loading || button.disabled"
              @click="button.click"
              @shortkey="button.click"
            >
              <v-icon :icon="button.icon" />
            </v-list-item>

            <v-divider v-if="$vuetify.display.width <= 350" />
            <template v-for="(item, key) in menu_modes" :key="key">
              <v-divider v-if="item.title == '-' && $vuetify.display.width <= 350" />
              <v-list-item
                v-else-if="$vuetify.display.width <= 350"
                :active="item.active"
                :disabled="item.disabled"
                @click="item.click"
              >
                <v-icon :icon="item.icon" />
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
            @click="toggleVolume"
          />
        </div>
        <div class="flex-grow-1 px-2" style="min-width: 100px">
          <v-progress-linear
            v-model="audio.volume"
            rounded
            clickable
            :height="10"
            color="white"
            @click="setVolume"
          />
        </div>
      </div>
    </div>
  </v-card>
</template>

<script>
import { computed } from "vue";
import LScreenBtn from "@/components/buttons/Screen.vue";
import PlayerControls from "@/components/PlayerControls.vue";
import PlayerProgress from "@/components/PlayerProgress.vue";
import { usePlayerState } from "@/composables/usePlayerState";

export default {
  name: "PlayerComponent",
  components: {
    LScreenBtn,
    PlayerControls,
    PlayerProgress,
  },
  props: {
    location: String,
  },
  setup() {
    const state = usePlayerState();
    const compactButtons = computed(() =>
      state.buttons.value.filter((item) => item.compact === true)
    );
    return { ...state, compactButtons };
  },
};
</script>
