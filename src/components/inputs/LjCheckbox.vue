<template>
  <v-switch
    v-if="is_switch"
    v-model="input"
    :color="$theme.primary()"
    :disabled="disabled"
    :label="label"
    density="compact"
    hide-details
  />
  <v-checkbox
    v-else
    v-model="input"
    :color="$theme.primary()"
    :disabled="disabled"
    :label="label"
    density="compact"
    hide-details
  />
</template>

<script>
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
  },
};
</script>
