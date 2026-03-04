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

    <template v-slot:system_buttons>
      <LScreenBtn module="stopwatch" />
    </template>

    <template v-slot:header>
      <l-toolbar>
        <l-toolbar-item>
          <l-select
            :label="t('customization.time_format')"
            v-model="userdata.time_format"
            :items="timeFormatOptions"
            item-value="value"
            item-title="title"
            density="compact"
            hide-details
            style="max-width: 170px"
          />
        </l-toolbar-item>

        <v-spacer />
        <l-toolbar-item>
          <v-btn
            v-if="!isRunning"
            color="green"
            size="small"
            @click="startStopwatch"
            variant="tonal"
          >
            <v-icon left>mdi-play</v-icon>
            {{ t("start") }}
          </v-btn>

          <v-btn
            v-else
            color="orange"
            size="small"
            @click="pauseStopwatch"
            variant="tonal"
          >
            <v-icon left>mdi-pause</v-icon>
            {{ t("pause") }}
          </v-btn>

          <v-btn
            color="red"
            size="small"
            @click="resetStopwatch"
            style="margin-left: 8px"
            variant="tonal"
          >
            <v-icon left>mdi-refresh</v-icon>
            {{ t("reset") }}
          </v-btn>

          <v-btn
            color="blue"
            size="small"
            @click="saveTime"
            style="margin-left: 8px"
            variant="tonal"
          >
            <v-icon left>mdi-content-save</v-icon>
            {{ t("save") }}
          </v-btn>
        </l-toolbar-item>

        <v-spacer />
      </l-toolbar>
    </template>

    <Screen ref="screen" />

    <template v-slot:right v-if="savedTimes.length > 0">
      <v-card
        flat
        class="pa-2 d-flex flex-column"
        style="width: 240px; height: 100%"
      >
        <v-card-title class="font-weight-light">
          <v-badge
            location="top right"
            color="warning"
            :content="savedTimes.length"
          >
            {{ t("saved_times") }} &nbsp;
          </v-badge>
        </v-card-title>
        <template v-slot:actions>
          <v-btn
            size="small"
            color="red"
            @click="clearSavedTimes"
            variant="tonal"
            block
          >
            {{ t("clear_all") }}
          </v-btn>
        </template>
        <v-card-text class="pa-0 ma-0">
          <v-list density="compact" class="bg-transparent">
            <v-list-item
              v-for="(item, index) in savedTimes"
              :key="index"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-icon size="small">mdi-timer</v-icon>
              </template>
              <v-list-item-title>
                {{ formatted(item) }}
              </v-list-item-title>
              <template v-slot:append>
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
        </v-card-text>
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
import LToolbar from "@/components/Toolbar.vue";
import LToolbarItem from "@/components/ToolbarItem.vue";

export default {
  name: manifest.id,
  components: {
    LWindow,
    Screen,
    LScreenBtn,
    LSelect,
    LCustomizationTools,
    LToolbar,
    LToolbarItem,
  },
  data: () => ({
    width: 0,
    height: 0,
    isRunning: false,
    startTime: null,
    pausedTime: null,
    savedTimes: [],
    timeFormatOptions: [
      { title: "hh:mm:ss.ms", value: "hh:mm:ss.ms" },
      { title: "hh:mm:ss", value: "hh:mm:ss" },
      { title: "mm:ss.ms", value: "mm:ss.ms" },
      { title: "mm:ss", value: "mm:ss" },
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
    appdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return this.$appdata.get(`modules.${this.module.id}.${key}`, null);
          },
          set: (_, key, value) => {
            this.$appdata.set(`modules.${this.module.id}.${key}`, value);
            return true;
          },
        },
      );
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */

    show() {
      return this.module.show;
    },
  },

  watch: {
    startTime() {
      this.appdata.start_time = this.startTime;
    },
    pausedTime() {
      this.appdata.paused_time = this.pausedTime;
    },
    isRunning() {
      this.appdata.is_running = this.isRunning;
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
      this.pauseStopwatch();
      this.resetStopwatch();
      this.$modules.close(this.module_id);
    },

    startStopwatch() {
      if (!this.startTime) {
        this.startTime = new Date();
      }
      this.pausedTime = null;
      this.isRunning = true;
    },

    pauseStopwatch() {
      this.pausedTime = new Date();
      this.isRunning = false;
    },

    resetStopwatch() {
      this.startTime = null;
      if (this.isRunning) {
        this.startStopwatch();
      }
      this.pausedTime = null;
    },

    saveTime() {
      const now = this.isRunning ? new Date() : this.pausedTime;
      const elapsedTime = now ? now - (this.startTime ?? now) : 0;

      this.savedTimes.push(elapsedTime);
    },

    deleteSavedTime(index) {
      this.savedTimes.splice(index, 1);
    },

    clearSavedTimes() {
      this.savedTimes = [];
    },

    formatted(time) {
      const totalMilliseconds = time;
      const hours = Math.floor(totalMilliseconds / 3600000);
      const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
      const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
      const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);

      const pad = (v) => String(v).padStart(2, "0");

      const tokens = {
        hh: pad(hours),
        mm: pad(minutes),
        ss: pad(seconds),
        ms: pad(milliseconds),
      };

      return this.userdata.time_format.replace(
        /hh|mm|ss|ms/g,
        (match) => tokens[match],
      );
    },
  },
};
</script>
