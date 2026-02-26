<template>
  <v-text-field
    v-model="input"
    :color="$theme.primary()"
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
    @click:appendInner="reset()"
  />
</template>

<script>
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
  },
  methods: {
    reset() {
      this.input = "";
    },
  },
};
</script>
