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

<script>
import AppData from "@/helpers/AppData";

export default {
  name: "CheckBoxComponent",
  props: {
    modelValue: Boolean,
    label: String,
    disabled: Boolean,
    switch: Boolean,
  },
  computed: {
    input: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
    is_switch() {
      return this.switch;
    },
    primaryColor() {
      return AppData.get("is_dark") ? undefined : "primary";
    },
  },
};
</script>
