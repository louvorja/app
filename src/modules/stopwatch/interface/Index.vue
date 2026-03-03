<template>
  <l-window
    v-model="module.show"
    :title="t('title')"
    :icon="module.icon"
    closable
    minimizable
    @close="close()"
    @minimize="$modules.minimize(module_id)"
    @resize="resize"
    :index="show ? 1 : 0"
  >
    <template v-slot:customize>
      <l-customization-tools
        :module="module"
        :items="[
          {
            name: t('customization.background'),
            items: [
              'background_color',
              ['image', 'image_opacity', 'image_fit'],
            ],
          },
          {
            name: t('customization.align'),
            items: [['horizontal_align', 'vertical_align']],
          },
          {
            name: t('customization.text'),
            items: [['font', 'font_size', 'font_color']],
          },
          { name: t('customization.window'), items: ['border_spacing'] },
        ]"
      />
    </template>

    <template v-slot:header>
      <v-toolbar density="compact">
        <l-select
          v-model="userdata.time_format"
          :items="timeFormatOptions"
          item-value="value"
          item-title="title"
          density="compact"
          hide-details
          style="max-width: 170px"
        />

        <v-spacer />

        <v-btn
          v-if="!isRunning"
          color="green"
          size="small"
          @click="startStopwatch"
        >
          <v-icon left>mdi-play</v-icon>
          {{ t('start') }}
        </v-btn>

        <v-btn
          v-else
          color="orange"
          size="small"
          @click="pauseStopwatch"
        >
          <v-icon left>mdi-pause</v-icon>
          {{ t('pause') }}
        </v-btn>

        <v-btn
          color="red"
          size="small"
          @click="resetStopwatch"
          style="margin-left: 8px"
        >
          <v-icon left>mdi-refresh</v-icon>
          {{ t('reset') }}
        </v-btn>

        <v-btn
          color="blue"
          size="small"
          @click="saveTime"
          style="margin-left: 8px"
        >
          <v-icon left>mdi-content-save</v-icon>
          {{ t('save') }}
        </v-btn>

        <v-spacer />

        <LScreenBtn module="stopwatch" />
      </v-toolbar>
    </template>

    <Screen ref="screen" />

    <template v-slot:right v-if="savedTimes.length > 0">
      <v-card flat class="pa-2" style="width: 240px; max-height: 100%; overflow-y: auto">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-subtitle-2">{{ t('saved_times') }} ({{ savedTimes.length }})</span>
          <v-btn size="x-small" color="red" @click="clearSavedTimes">
            {{ t('clear_all') }}
          </v-btn>
        </div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item
            v-for="(item, index) in savedTimes"
            :key="index"
            class="px-0"
          >
            <template v-slot:prepend>
              <v-icon size="small">mdi-timer</v-icon>
            </template>
            <v-list-item-title>{{ item.formatted }}</v-list-item-title>
            <template v-slot:append>
              <v-btn
                icon
                size="x-small"
                variant="text"
                @click="loadTime(item.time)"
              >
                <v-icon size="small">mdi-restore</v-icon>
              </v-btn>
              <v-btn
                icon
                size="x-small"
                variant="text"
                color="red"
                @click="deleteSavedTime(index)"
              >
                <v-icon size="small">mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </template>
  </l-window>
</template>

<script>
import manifest from "../manifest.json";
import LWindow from "@/components/Window.vue";
import Screen from "../components/Screen.vue";
import LScreenBtn from "@/components/buttons/Screen.vue";
import LSelect from "@/components/inputs/Select.vue";
import LCustomizationTools from "@/components/CustomizationTools.vue";

export default {
  name: manifest.id,
  components: {
    LWindow,
    Screen,
    LScreenBtn,
    LSelect,
    LCustomizationTools,
  },
  data: () => ({
    width: 0,
    height: 0,
    isRunning: false,
    timeFormatOptions: [
      { title: "hh.mm.ss.ms", value: "hh.mm.ss.ms" },
      { title: "hh.mm.ss", value: "hh.mm.ss" },
      { title: "mm.ss.ms", value: "mm.ss.ms" },
      { title: "mm.ss", value: "mm.ss" },
    ],
    fonts: [
      "Arial, sans-serif",
      "Helvetica, sans-serif",
      "Times New Roman, serif",
      "Georgia, serif",
      "Courier New, monospace",
      "Verdana, sans-serif",
      "Roboto, sans-serif",
    ],
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

    show() {
      return this.module.show;
    },

    savedTimes() {
      return this.userdata.savedTimes || [];
    },
  },
  methods: {
    /* METHODS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    /* METHODS OBRIGATÓRIAS - FIM */

    resize(data) {
      this.width = data.container_width;
      this.height = data.container_height;
    },

    close() {
      this.$modules.close(this.module_id);
    },

    startStopwatch() {
      this.isRunning = true;
      if (this.$refs.screen) {
        this.$refs.screen.start();
      }
    },

    pauseStopwatch() {
      this.isRunning = false;
      if (this.$refs.screen) {
        this.$refs.screen.pause();
      }
    },

    resetStopwatch() {
      this.isRunning = false;
      if (this.$refs.screen) {
        this.$refs.screen.reset();
      }
    },

    saveTime() {
      if (this.$refs.screen) {
        const currentTime = this.$refs.screen.elapsedTime;
        if (currentTime > 0) {
          const savedTimes = this.userdata.savedTimes || [];
          savedTimes.push({
            time: currentTime,
            formatted: this.$refs.screen.formattedTime,
            date: new Date().toISOString()
          });
          this.userdata.savedTimes = savedTimes;
        }
      }
    },

    loadTime(time) {
      if (this.$refs.screen) {
        this.$refs.screen.elapsedTime = time;
        this.$refs.screen.pausedTime = time;
        this.isRunning = false;
        this.$refs.screen.pause();
      }
    },

    deleteSavedTime(index) {
      const savedTimes = [...this.userdata.savedTimes];
      savedTimes.splice(index, 1);
      this.userdata.savedTimes = savedTimes;
    },

    clearSavedTimes() {
      this.userdata.savedTimes = [];
    },
  },
};
</script>
