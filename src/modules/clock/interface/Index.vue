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
      <LScreenBtn module="clock" />
    </template>

    <template #header>
      <l-toolbar>
        <l-toolbar-item>
          <l-select
            v-model="userdata.hour_cycle"
            :label="t('customization.hour_cycle')"
            :items="timeFormatOptions"
            item-value="value"
            item-title="title"
            density="compact"
            hide-details
            style="width: 130px"
          />
        </l-toolbar-item>

        <l-toolbar-item>
          <l-select
            v-model="userdata.time_format"
            :label="t('customization.time_format')"
            :items="timeTypeOptions"
            item-value="value"
            item-title="title"
            density="compact"
            hide-details
            style="width: 160px"
          />
        </l-toolbar-item>
      </l-toolbar>
    </template>

    <Screen />
  </l-window>
</template>

<script setup>
import { ref, computed } from "vue";
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

const timeFormatOptions = [
  { title: "24h", value: "24h" },
  { title: "12h", value: "12h" },
];

const timeTypeOptions = [
  { title: "hh:mm:ss", value: "hh:mm:ss" },
  { title: "hh:mm", value: "hh:mm" },
  { title: "hh", value: "hh" },
];

const t = (text) => i18nT(`modules.${moduleId}.${text}`);

function resize(_data) {}

function close() {
  Modules.close(moduleId);
}

function minimize() {
  Modules.minimize(moduleId);
}
</script>
