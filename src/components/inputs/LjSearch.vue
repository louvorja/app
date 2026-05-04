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

<script>
import AppData from "@/helpers/AppData";

export default {
  name: "SearchComponent",
  props: {
    modelValue: String,
    label: String,
    disabled: Boolean,
    disabledHint: String,
    error: Boolean,
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
    primaryColor() {
      return AppData.get("is_dark") ? undefined : "primary";
    },
  },
  methods: {
    reset() {
      this.input = "";
    },
  },
};
</script>
