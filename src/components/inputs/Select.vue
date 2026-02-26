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
        hide-details
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
          :active="active(item)"
        >
          <template v-if="multiple" #prepend>
            <v-checkbox
              @click.stop="selectCheck(item)"
              :model-value="active(item)"
              hide-details
            />
          </template>

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
    display: {
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
      if (this.display) {
        return this.display;
      } else if (this.multiple && Array.isArray(this.modelValue)) {
        return this.modelValue
          .map((value) => {
            const item = this.items.find((i) => i[this.itemValue] == value);
            return item ? item[this.itemTitle] : "";
          })
          .filter(Boolean)
          .join(", ");
      } else {
        const selected = this.items.find(
          (item) => item[this.itemValue] === this.modelValue,
        );

        return selected ? selected[this.itemTitle] : "";
      }
    },
  },

  methods: {
    select(item) {
      console.log("Selected item:", item, this.multiple);
      if (this.multiple) {
        this.$emit("update:modelValue", [+item[this.itemValue]]);
      } else {
        this.$emit("update:modelValue", item[this.itemValue]);
      }
      this.menu = false;
      this.search = "";
    },
    selectCheck(item) {
      const currentValues = Array.isArray(this.modelValue)
        ? this.modelValue
        : [];
      const newValue = +item[this.itemValue];
      const index = currentValues.indexOf(newValue);
      if (index > -1) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(newValue);
      }
      this.$emit("update:modelValue", currentValues);
    },

    clear() {
      this.$emit("update:modelValue", null);
    },

    active(item) {
      return this.multiple
        ? Array.isArray(this.modelValue) &&
            (this.modelValue.includes(item[this.itemValue]) ||
              this.modelValue.includes(+item[this.itemValue]))
        : item[this.itemValue] == this.modelValue;
    },
  },
};
</script>
