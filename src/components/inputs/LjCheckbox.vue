<template>
  <v-switch
    v-if="is_switch"
    v-model="input"
    :color="primaryColor"
    :disabled="disabled"
    :label="label"
    density="compact"
    hide-details
  />
  <v-checkbox
    v-else
    v-model="input"
    :color="primaryColor"
    :disabled="disabled"
    :label="label"
    density="compact"
    hide-details
  />
</template>

<script setup>
import { computed } from "vue";
import AppData from "@/helpers/AppData";

const props = defineProps({
  modelValue: Boolean,
  label: String,
  disabled: Boolean,
  switch: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const input = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const is_switch = computed(() => props.switch);
const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));
</script>
