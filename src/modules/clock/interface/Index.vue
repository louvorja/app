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
      <LScreenBtn module="clock" />
    </template>

    <template v-slot:header>
      <l-toolbar>
        <l-toolbar-item>
          <l-select
            :label="t('customization.hour_cycle')"
            v-model="userdata.hour_cycle"
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
            :label="t('customization.time_format')"
            v-model="userdata.time_format"
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
    timeFormatOptions: [
      { title: "24h", value: "24h" },
      { title: "12h", value: "12h" },
    ],
    timeTypeOptions: [
      { title: "hh:mm:ss", value: "hh:mm:ss" },
      { title: "hh:mm", value: "hh:mm" },
      { title: "hh", value: "hh" },
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
  },
};
</script>
