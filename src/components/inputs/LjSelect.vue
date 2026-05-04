<template>
  <v-select
    v-model="input"
    v-model:menu="menu"
    :label="label"
    :items="items"
    :item-title="itemTitle"
    :item-value="itemValue"
    :prepend-inner-icon="icon"
    density="compact"
    variant="outlined"
    :multiple="multiple"
    hide-details
  >
    <template #menu-header="{ search, filteredItems }">
      <div class="pa-2 border-b">
        <v-text-field
          v-model="search.value"
          :error="!!search.value && !filteredItems.length"
          density="compact"
          :placeholder="$t('components.inputs.search') + '...'"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
        ></v-text-field>
      </div>
    </template>
  </v-select>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: [String, Number, Array],
  label: String,
  icon: String,
  multiple: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Array,
    default: () => [],
  },
  itemValue: {
    type: String,
    default: "id",
  },
  itemTitle: {
    type: String,
    default: "value",
  },
  itemSubtitle: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue"]);

const menu = ref(false);

const input = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>
