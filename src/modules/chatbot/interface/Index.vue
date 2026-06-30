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
            items: ['background_color'],
          },
          {
            name: t('customization.color'),
            items: [['font_color']],
          },
          {
            name: t('customization.size'),
            items: ['font_size'],
          },
        ]"
      />
    </template>

    <template v-slot:system_buttons>
      <LScreenBtn module="chatbot" />
    </template>

    <template v-slot:header>
      <l-toolbar>
        <l-toolbar-item>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="clearChat"
            :title="t('new_chat')"
          >
            <v-icon size="small">mdi-plus</v-icon>
          </v-btn>
        </l-toolbar-item>
      </l-toolbar>
    </template>

    <ChatScreen
      :width="width"
      :height="height"
      :font-size="fontSize"
      :font-color="fontColor"
    />
  </l-window>
</template>

<script>
import manifest from "../manifest.json";
import LWindow from "@/components/Window.vue";
import ChatScreen from "../components/ChatScreen.vue";
import LScreenBtn from "@/components/buttons/Screen.vue";
import LCustomizationTools from "@/components/CustomizationTools.vue";
import LToolbar from "@/components/Toolbar.vue";
import LToolbarItem from "@/components/ToolbarItem.vue";

export default {
  name: manifest.id,
  components: {
    LWindow,
    ChatScreen,
    LScreenBtn,
    LCustomizationTools,
    LToolbar,
    LToolbarItem,
  },
  data: () => ({
    width: 0,
    height: 0,
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
    fontSize() {
      return this.userdata.font_size || 13;
    },
    fontColor() {
      return this.userdata.font_color || "#FFFFFF";
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

    clearChat() {
      this.$emit("clear-chat");
    },
  },
};
</script>
