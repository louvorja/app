<template>
  <Window
    v-if="manifest"
    v-model="module.show"
    :title="title ?? t('title')"
    :icon="module.icon"
    closable
    minimizable
    :compact="compact"
    :index="index"
    :size="manifest?.moduleOptions?.size ?? null"
    @close="close()"
    @minimize="minimize()"
    @scroll="scroll()"
    @hasScroll="hasScroll()"
  >
    <template v-slot:header>
      <slot name="header" />
    </template>
    <template v-slot:left>
      <slot name="left" />
    </template>
    <template v-slot:right>
      <slot name="right" />
    </template>
    <template v-slot:footer>
      <slot name="footer" />
    </template>

    <template v-slot:default>
      <slot />
    </template>
  </Window>
</template>

<script>
import Window from "@/components/Window.vue";

export default {
  name: "ModuleContainer",
  components: {
    Window,
  },
  props: {
    manifest: {
      type: Object,
      required: true,
    },
    title: {
      type: String,
      default: null,
    },
    compact: {
      type: Boolean,
      default: false,
    },
    index: {
      type: [Boolean, Number, String],
      default: null,
    },
  },
  computed: {
    module_id() {
      return this.manifest.id;
    },
    module() {
      return this.$modules.get(this.module_id);
    },
    show() {
      return this.module.show;
    },

    /* 
       userdata são os dados do usuário, que devem ser salvos na máquina ou session
       (configurações, personalizações, etc...) 
    */
    userdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return this.$userdata.get(`modules.${this.module_id}.${key}`, null);
          },
          set: (_, key, value) => {
            this.$userdata.set(`modules.${this.module_id}.${key}`, value);
            return true;
          },
        },
      );
    },

    /* 
       appdata são os dados do módulo, que são usados somente enquanto o módulo está ativo
       e que podem ser destruídos depois (não são salvos)
    */
    appdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return this.$appdata.get(`modules.${this.module_id}.${key}`, null);
          },
          set: (_, key, value) => {
            this.$appdata.set(`modules.${this.module_id}.${key}`, value);
            return true;
          },
        },
      );
    },
  },
  watch: {
    show(value) {
      this.$emit("show", value);
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    close() {
      this.$modules.close(this.module_id);
      this.$emit("close");
    },
    minimize() {
      this.$modules.minimize(this.module_id);
      this.$emit("minimize");
    },
    scroll() {
      this.$emit("scroll");
    },
    hasScroll() {
      this.$emit("hasScroll");
    },
  },
};
</script>
