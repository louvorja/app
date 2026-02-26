<template>
  <v-menu v-model="menu" :close-on-content-click="false" :offset="0">
    <!-- Campo principal -->
    <template #activator="{ props }">
      <v-text-field
        v-bind="props"
        v-model="displayText"
        :label="label"
        :prepend-inner-icon="icon"
        density="compact"
        variant="outlined"
        readonly
        @click:clear="clear"
      />
    </template>

    <!-- Dropdown -->
    <v-card>
      <!-- HEADER -->
      <div class="pa-2 border-b">
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Buscar..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          hide-details
          autofocus
          @keydown.enter="filteredItems.length > 0 && select(filteredItems[0])"
        />
      </div>

      <!-- LISTA -->
      <v-list max-height="300" class="overflow-y-auto">
        <v-list-item
          v-for="item in filteredItems"
          :key="item[itemValue]"
          @click="select(item)"
          :active="item[itemValue] === modelValue"
        >
          <v-list-item-title>
            {{ item[itemTitle] }}
          </v-list-item-title>

          <v-list-item-subtitle v-if="itemSubtitle">
            {{ item[itemSubtitle] }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-if="!filteredItems.length">
          <v-list-item-title class="text-medium-emphasis">
            Nenhum resultado encontrado
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  name: "SelectComponent",

  props: {
    modelValue: [String, Number],
    label: String,
    icon: String,
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
  },

  emits: ["update:modelValue"],

  data() {
    return {
      menu: false,
      search: "",
    };
  },

  computed: {
    filteredItems() {
      if (!this.search) return this.items;

      return this.items.filter((item) =>
        String(item[this.itemTitle])
          .toLowerCase()
          .includes(this.search.toLowerCase()),
      );
    },

    displayText() {
      const selected = this.items.find(
        (item) => item[this.itemValue] === this.modelValue,
      );

      return selected ? selected[this.itemTitle] : "";
    },
  },

  methods: {
    select(item) {
      console.log("Selected item:", item);
      this.$emit("update:modelValue", item[this.itemValue]);
      this.menu = false;
      this.search = "";
    },

    clear() {
      this.$emit("update:modelValue", null);
    },
  },
};
</script>
