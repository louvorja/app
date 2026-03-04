<template>
  <v-btn-group
    v-if="!is_mobile"
    :variant="variant"
    style="overflow: clip;"
  >
    <v-btn
      :size="size"
      :active="is_popup_opened"
      icon="mdi-open-in-new"
      :class="{ 'rotate-icon': is_selected }"
      @click="popup()"
    />

    <v-menu v-if="is_popup_opened" location="bottom">
      <template #activator="{ props }">
        <v-btn v-bind="props" :size="size" icon="mdi-chevron-down" density="compact" />
      </template>

      <v-list density="compact">
        <v-list-item @click="close">
          <v-list-item-title>{{ $t("popup.close") }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-btn-group>
</template>

<script>
export default {
  name: "ButtonScreenComponent",
  props: {
    module: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      default: "small",
    },
    variant: {
      type: String,
      default: "text",
    },
  },
  computed: {
    is_mobile: function () {
      return this.$appdata.get("is_mobile");
    },
    is_popup_opened: function () {
      const multiplePopups = this.$userdata.get("multiple_popups", false);
      if (multiplePopups) {
        const popups = this.$appdata.get("popups") || {};
        return !!(popups[this.module] && !popups[this.module].closed);
      }
      const popup = this.$appdata.get("popup_instance");
      return !!(popup && !popup.closed);
    },
    popup_module: function () {
      return this.$appdata.get("popup_module");
    },
    is_selected: function () {
      const multiplePopups = this.$userdata.get("multiple_popups", false);
      if (multiplePopups) {
        return this.is_popup_opened;
      }
      return this.is_popup_opened && this.popup_module == this.module;
    },
  },
  methods: {
    popup: function () {
      if (this.is_selected) {
        this.$popup.exit();
      } else {
        this.$popup.open(this.module);
      }
    },
    close: function () {
      this.$popup.close(this.module);
    },
  },
};
</script>

<style scoped>
.rotate-icon {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
</style>
