<template>
  <v-text-field
    v-model="input"
    :color="primaryColor"
    :disabled="disabled"
    :label="label"
    prepend-inner-icon="mdi-magnify"
    :append-inner-icon="input ? 'mdi-close' : ''"
    density="compact"
    variant="outlined"
    :hide-details="!disabled"
    :hint="disabled ? disabledHint : ''"
    :persistent-hint="disabled"
    :loading="disabled"
    :error="error"
    @click:append-inner="reset()"
  />
</template>

<script setup>
import { computed } from "vue";
import AppData from "@/helpers/AppData";

const props = defineProps({
  modelValue: String,
  label: String,
  disabled: Boolean,
  disabledHint: String,
  error: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const input = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));

function reset() {
  input.value = "";
}
</script>
