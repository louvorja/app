<template>
  <v-btn-group v-if="!is_mobile" :variant="variant" style="overflow: clip">
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

<script setup>
import { computed } from "vue";
import AppData from "@/helpers/AppData";
import Popup from "@/helpers/Popup";

const props = defineProps({
  module: { type: String, required: true },
  size: { type: String, default: "small" },
  variant: { type: String, default: "text" },
});

const is_mobile = computed(() => AppData.get("is_mobile"));
const is_popup_opened = computed(() => !!AppData.get("popup"));
const popup_module = computed(() => AppData.get("popup_module"));
const is_selected = computed(() => is_popup_opened.value && popup_module.value == props.module);

function popup() {
  if (is_selected.value) {
    Popup.exit();
  } else {
    Popup.open(props.module);
  }
}

function close() {
  Popup.close();
}
</script>

<style scoped>
.rotate-icon {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
</style>
