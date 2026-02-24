<template>
  <Window
    v-if="manifest"
    v-model="module.show"
    :title="t('title')"
    :icon="module.icon"
    :flat="isFlat"
    closable
    minimizable
    :size="manifest?.moduleOptions?.size ?? null"
    @close="close()"
    @minimize="minimize()"
  >
    <template v-slot:header v-if="$slots.header">
      <slot name="header" />
    </template>
    <template v-slot:left v-if="$slots.left">
      <slot name="left" />
    </template>
    <template v-slot:right v-if="$slots.right">
      <slot name="right" />
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
    flat: {
      type: Boolean,
      default: null,
    },
  },
  computed: {
    isFlat() {
      // Se o prop 'flat' foi passado explicitamente, use-o
      if (this.flat !== null) return this.flat;
      // Caso contrário, se for um módulo flutuante, não é flat
      return !this.$modules.isFloating(this.module_id);
    },
    module_id() {
      return this.manifest.id;
    },
    module() {
      return this.$modules.get(this.module_id);
    },
    show() {
      return this.module.show;
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
  },
};
</script>
