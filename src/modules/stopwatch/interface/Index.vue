<template>
  <l-window
    v-model="moduleShow"
    :title="t('title')"
    :icon="module_.icon"
    closable
    minimizable
    :index="moduleShow ? 1 : 0"
    @close="close()"
    @minimize="minimize()"
    @resize="resize"
  >
    <template #customize>
      <l-customization-tools
        :module="module_"
        :items="[
          {
            name: t('customization.background'),
            items: ['background_color', ['image', 'image_opacity', 'image_fit']],
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

    <template #system_buttons>
      <LScreenBtn module="stopwatch" />
    </template>

    <template #header>
      <l-toolbar>
        <l-toolbar-item>
          <l-select
            v-model="userdata.time_format"
            :label="t('customization.time_format')"
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
            variant="tonal"
            @click="startStopwatch"
          >
            <v-icon left>mdi-play</v-icon>
            {{ t("start") }}
          </v-btn>

          <v-btn v-else color="orange" size="small" variant="tonal" @click="pauseStopwatch">
            <v-icon left>mdi-pause</v-icon>
            {{ t("pause") }}
          </v-btn>

          <v-btn
            color="red"
            size="small"
            style="margin-left: 8px"
            variant="tonal"
            @click="resetStopwatch"
          >
            <v-icon left>mdi-refresh</v-icon>
            {{ t("reset") }}
          </v-btn>

          <v-btn
            color="blue"
            size="small"
            style="margin-left: 8px"
            variant="tonal"
            @click="saveTime"
          >
            <v-icon left>mdi-content-save</v-icon>
            {{ t("save") }}
          </v-btn>
        </l-toolbar-item>

        <v-spacer />
      </l-toolbar>
    </template>

    <Screen ref="screen" />

    <template v-if="savedTimes.length > 0" #right>
      <v-card flat class="pa-2 d-flex flex-column" style="width: 240px; height: 100%">
        <v-card-title class="font-weight-light">
          <v-badge location="top right" color="warning" :content="savedTimes.length">
            {{ t("saved_times") }} &nbsp;
          </v-badge>
        </v-card-title>
        <template #actions>
          <v-btn size="small" color="red" variant="tonal" block @click="clearSavedTimes">
            {{ t("clear_all") }}
          </v-btn>
        </template>
        <v-card-text class="pa-0 ma-0">
          <v-list density="compact" class="bg-transparent">
            <v-list-item v-for="(item, index) in savedTimes" :key="index" class="px-0">
              <template #prepend>
                <v-icon size="small">mdi-timer</v-icon>
              </template>
              <v-list-item-title>
                {{ formatted(item) }}
              </v-list-item-title>
              <template #append>
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

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import manifest from "../manifest.json";
import LWindow from "@/components/Window.vue";
import Screen from "../components/Screen.vue";
import LScreenBtn from "@/components/buttons/Screen.vue";
import LSelect from "@/components/inputs/LjSelect.vue";
import LCustomizationTools from "@/components/CustomizationTools.vue";
import LToolbar from "@/components/Toolbar.vue";
import LToolbarItem from "@/components/ToolbarItem.vue";
import Modules from "@/helpers/Modules";
import UserData from "@/helpers/UserData";
import AppData from "@/helpers/AppData";

const { t: i18nT } = useI18n();

const moduleId = manifest.id;
const module_ = computed(() => Modules.get(moduleId));
const moduleShow = computed(() => module_.value?.show);

const userdata = computed(
  () =>
    new Proxy(
      {},
      {
        get: (_, key) => UserData.get(`modules.${moduleId}.${key}`, null),
        set: (_, key, value) => {
          UserData.set(`modules.${moduleId}.${key}`, value);
          return true;
        },
      }
    )
);

const appdata = computed(
  () =>
    new Proxy(
      {},
      {
        get: (_, key) => AppData.get(`modules.${moduleId}.${key}`, null),
        set: (_, key, value) => {
          AppData.set(`modules.${moduleId}.${key}`, value);
          return true;
        },
      }
    )
);

const isRunning = ref(false);
const startTime = ref(null);
const pausedTime = ref(null);
const savedTimes = ref([]);

const timeFormatOptions = [
  { title: "hh:mm:ss.ms", value: "hh:mm:ss.ms" },
  { title: "hh:mm:ss", value: "hh:mm:ss" },
  { title: "mm:ss.ms", value: "mm:ss.ms" },
  { title: "mm:ss", value: "mm:ss" },
];

const t = (text) => i18nT(`modules.${moduleId}.${text}`);

watch(startTime, (val) => {
  appdata.value.start_time = val;
});
watch(pausedTime, (val) => {
  appdata.value.paused_time = val;
});
watch(isRunning, (val) => {
  appdata.value.is_running = val;
});

function resize(_data) {}

function close() {
  pauseStopwatch();
  resetStopwatch();
  Modules.close(moduleId);
}

function minimize() {
  Modules.minimize(moduleId);
}

function startStopwatch() {
  if (!startTime.value) startTime.value = new Date();
  pausedTime.value = null;
  isRunning.value = true;
}

function pauseStopwatch() {
  pausedTime.value = new Date();
  isRunning.value = false;
}

function resetStopwatch() {
  startTime.value = null;
  if (isRunning.value) startStopwatch();
  pausedTime.value = null;
}

function saveTime() {
  const now = isRunning.value ? new Date() : pausedTime.value;
  const elapsed = now ? now - (startTime.value ?? now) : 0;
  savedTimes.value.push(elapsed);
}

function deleteSavedTime(index) {
  savedTimes.value.splice(index, 1);
}

function clearSavedTimes() {
  savedTimes.value = [];
}

function formatted(time) {
  const totalMs = time;
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = Math.floor((totalMs % 1000) / 10);
  const pad = (v) => String(v).padStart(2, "0");
  const tokens = { hh: pad(hours), mm: pad(minutes), ss: pad(seconds), ms: pad(milliseconds) };
  return (userdata.value.time_format || "hh:mm:ss.ms").replace(
    /hh|mm|ss|ms/g,
    (match) => tokens[match]
  );
}
</script>
