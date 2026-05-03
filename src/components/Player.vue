<template>
  <v-card theme="dark" class="w-100 pa-0 ma-0 d-flex align-center" :rounded="0">
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
    </div>
    <div class="d-flex flex-column">
      <PlayerActions
        :location="location"
        :minimized="media.minimized"
        :compact="compact"
        :loading="media.loading"
        :slide-index="media.config.slide_index"
        :mode="mode"
        :menu-modes="menu_modes"
        :slides="slides"
        :compact-buttons="compactButtons"
        @go-to-slide="goToSlide"
        @maximize="maximize"
        @fullscreen="fullscreen"
        @close="close"
      />
      <PlayerGauge
        v-if="media.config.audio"
        :volume="audio.volume"
        :icon="volume_icon"
        :loading="media.loading"
        @toggle="toggleVolume"
        @seek="setVolume"
      />
    </div>
  </v-card>
</template>

<script>
import { computed } from "vue";
import PlayerControls from "@/components/PlayerControls.vue";
import PlayerProgress from "@/components/PlayerProgress.vue";
import PlayerGauge from "@/components/PlayerGauge.vue";
import PlayerActions from "@/components/PlayerActions.vue";
import { usePlayerState } from "@/composables/usePlayerState";

export default {
  name: "PlayerComponent",
  components: {
    PlayerControls,
    PlayerProgress,
    PlayerGauge,
    PlayerActions,
  },
  props: {
    location: { type: String, default: "" },
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
