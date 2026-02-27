<template>
  <v-slide-group show-arrows class="__customization_tools">
    <!-- BLOCOS -->
    <v-slide-group-item
      v-for="(block, indx_block) in menu_items"
      :key="indx_block"
    >
      <v-card class="d-flex flex-column pt-2 px-1">
        <v-card-text style="flex: 1" class="d-flex pa-0 ma-0 px-1">
          <!-- GRUPOS -->
          <template
            v-for="(group, indx_group) in block.items"
            :key="indx_group"
          >
            <v-divider v-if="indx_group > 0" vertical class="mx-1" />
            <div class="d-flex flex-column justify-center">
              <!-- ITEMS -->
              <div
                v-for="(item, indx_item) in group"
                :key="indx_item"
                class="my-1"
              >
                <v-text-field
                  v-if="item?.type == 'color'"
                  v-model="userdata[item.property]"
                  :label="item?.label"
                  :width="100"
                  type="color"
                  prepend-inner-icon="mdi-palette"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-else-if="
                    ['font-size', 'border-spacing'].includes(item?.type)
                  "
                  v-model="userdata[item.property]"
                  :label="item?.label"
                  :width="120"
                  type="number"
                  :min="1"
                  :max="90"
                  :prepend-inner-icon="
                    item?.type == 'font-size'
                      ? 'mdi-format-font-size-increase'
                      : 'mdi-border-all-variant'
                  "
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-select
                  v-else-if="item?.type == 'font'"
                  v-model="userdata[item.property]"
                  :label="item?.label"
                  :width="200"
                  prepend-inner-icon="mdi-format-font"
                  density="compact"
                  variant="outlined"
                  :items="fonts"
                  item-title="label"
                  item-value="value"
                  hide-details
                />
                <v-text-field
                  v-else
                  v-model="userdata[item.property]"
                  :label="item?.label"
                  :width="200"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </div>
              <!--
              <v-text-field
                label="Fonte"
                density="compact"
                hide-details
                width="200"
                class="my-1"
              />
              <v-select
                label="Tamanho"
                density="compact"
                hide-details
                class="my-1"
              />
              -->
            </div>
          </template>
        </v-card-text>
        <v-card-subtitle class="text-center">
          <small>{{ block.name }}</small>
        </v-card-subtitle>
      </v-card>
    </v-slide-group-item>
    <!--
    <v-slide-group-item>
      <v-card class="d-flex flex-column">
        <v-card-text style="flex: 1" class="pa-0 ma-0 px-1">
          <div>
            <v-btn color="blue" />
          </div>
        </v-card-text>
        <v-card-subtitle class="text-center"> Cores </v-card-subtitle>
      </v-card>
    </v-slide-group-item>
    <v-slide-group-item>
      <v-card class="d-flex flex-column">
        <v-card-text style="flex: 1" class="pa-0 ma-0 px-1">
          <div class="d-flex flex-column">
            <v-btn color="blue" />
            <v-btn color="red" />
          </div>
        </v-card-text>
        <v-card-subtitle class="text-center"> Cores </v-card-subtitle>
      </v-card>
    </v-slide-group-item>
    <v-slide-group-item>
      <v-card>
        <v-card-text class="d-flex pa-0 ma-0 px-1">
          <div>
            <v-text-field
              label="Fonte"
              density="compact"
              hide-details
              width="200"
              class="my-1"
            />
            <v-select
              label="Tamanho"
              density="compact"
              hide-details
              class="my-1"
            />
          </div>
          <v-divider vertical class="mx-1" />
          <div>
            <v-text-field
              label="Fonte"
              density="compact"
              hide-details
              width="200"
              class="my-1"
            />
            <v-select
              label="Tamanho"
              density="compact"
              hide-details
              class="my-1"
            />
          </div>
        </v-card-text>
        <v-card-subtitle class="text-center"> Grupo de Ações </v-card-subtitle>
      </v-card>
    </v-slide-group-item>
    <v-slide-group-item>
      <v-card>
        <v-card-text class="d-flex pa-0 ma-0 px-1">
          <div>
            <v-text-field
              label="Fonte"
              density="compact"
              hide-details
              width="200"
              class="my-1"
            />
            <v-select
              label="Tamanho"
              density="compact"
              hide-details
              class="my-1"
            />
          </div>
          <v-divider vertical class="mx-1" />
          <div>
            <v-text-field
              label="Fonte"
              density="compact"
              hide-details
              width="200"
              class="my-1"
            />
          </div>
        </v-card-text>
        <v-card-subtitle class="text-center"> Grupo de Ações </v-card-subtitle>
      </v-card>
    </v-slide-group-item>
    -->
  </v-slide-group>
</template>

<script>
export default {
  name: "CustomizationToolsComponent",
  props: {
    module: Object,
    items: Array,
  },
  data: () => ({
    fonts: [
      { label: "Arial", value: "Arial, sans-serif" },
      { label: "Helvetica", value: "Helvetica, sans-serif" },
      { label: "Times New Roman", value: "Times New Roman, serif" },
      { label: "Georgia", value: "Georgia, serif" },
      { label: "Courier New", value: "Courier New, monospace" },
      { label: "Verdana", value: "Verdana, sans-serif" },
      { label: "DIN Condensed", value: "din-bold, sans-serif" },
      { label: "Roboto", value: "Roboto, sans-serif" },
    ],
  }),
  computed: {
    menu_items() {
      return this.items.map((block) => {
        return this.toBlock(block);
      });
    },
    userdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return this.$userdata.get(`modules.${this.module.id}.${key}`, null);
          },
          set: (_, key, value) => {
            this.$userdata.set(`modules.${this.module.id}.${key}`, value);
            return true;
          },
        },
      );
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.${this.module.id}.${text}`);
    },
    toBlock(item) {
      /* Blocos */
      if (typeof item == "string") {
        item = { name: this.label(item), items: this.toArray(item) };
      } else if (Array.isArray(item)) {
        item = { name: "", items: item };
      }

      item.items = this.toArray(item?.items).map((group) => {
        /* Grupos */
        return this.toArray(group).map((el) => {
          /* Elementos */
          return {
            ...this.properties(el),
            property: el,
            label: this.label(el),
          };
        });
      });
      return item;
    },
    toArray(item) {
      if (item == null) {
        return [];
      }
      if (typeof item == "string") {
        return [item];
      }
      if (!Array.isArray(item)) {
        return [];
      }
      return item;
    },
    label(item) {
      return this.t(this.module?.manifest?.customization[item]?.label);
    },
    properties(item) {
      return this.module?.manifest?.customization[item];
    },
  },
};
</script>

<style lang="scss">
.__customization_tools {
  input {
    &[type="color"] {
      padding: 4px;
    }
  }
}
</style>
