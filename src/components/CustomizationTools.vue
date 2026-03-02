<template>
  <v-slide-group show-arrows class="__customization_tools px-1">
    <!-- BLOCOS -->
    <v-slide-group-item
      v-for="(block, indx_block) in menu_items"
      :key="indx_block"
    >
      <v-divider v-if="indx_block > 0" vertical class="mx-1" />
      <v-card flat class="d-flex flex-column pt-2">
        <v-card-text style="flex: 1" class="d-flex pa-0 ma-0">
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
                class="my-2"
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
                <v-number-input
                  v-else-if="
                    ['font-size', 'border-spacing'].includes(item?.type)
                  "
                  v-model="userdata[item.property]"
                  :label="item?.label"
                  :width="150"
                  :min="1"
                  :max="90"
                  :prepend-inner-icon="
                    item?.type == 'font-size'
                      ? 'mdi-format-font-size-increase'
                      : 'mdi-border-all-variant'
                  "
                  density="compact"
                  variant="outlined"
                  control-variant="split"
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
                <v-btn-toggle
                  v-else-if="item?.type == 'h-align'"
                  v-model="userdata[item.property]"
                  :label="item?.label"
                  density="compact"
                  variant="outlined"
                >
                  <v-btn value="start">
                    <v-icon>mdi-format-horizontal-align-left</v-icon>
                  </v-btn>
                  <v-btn value="center">
                    <v-icon>mdi-format-horizontal-align-center</v-icon>
                  </v-btn>
                  <v-btn value="end">
                    <v-icon>mdi-format-horizontal-align-right</v-icon>
                  </v-btn>
                </v-btn-toggle>
                <v-btn-toggle
                  v-else-if="item?.type == 'v-align'"
                  v-model="userdata[item.property]"
                  :label="item?.label"
                  density="compact"
                  variant="outlined"
                >
                  <v-btn value="start">
                    <v-icon>mdi-format-vertical-align-top</v-icon>
                  </v-btn>
                  <v-btn value="center">
                    <v-icon>mdi-format-vertical-align-center</v-icon>
                  </v-btn>
                  <v-btn value="end">
                    <v-icon>mdi-format-vertical-align-bottom</v-icon>
                  </v-btn>
                </v-btn-toggle>
                <v-btn
                  v-else-if="item?.type == 'restore'"
                  icon="mdi-restore"
                  size="x-large"
                  variant="tonal"
                  color="primary"
                  @click="restore"
                />
                <v-text-field
                  v-else-if="item?.type == 'image'"
                  v-model="userdata[item.property]"
                  :label="item?.label"
                  :width="200"
                  type="text"
                  prepend-inner-icon="mdi-image-area"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-select
                  v-else-if="item?.type == 'object-fit'"
                  v-model="userdata[item.property]"
                  :label="item?.label"
                  :width="200"
                  prepend-inner-icon="mdi-fit-to-page"
                  density="compact"
                  variant="outlined"
                  :items="fit"
                  item-title="label"
                  item-value="value"
                  hide-details
                />
                <div
                  v-else-if="item?.type == 'opacity'"
                  class="px-1"
                  style="width: 200px"
                >
                  <span
                    class="text-label-small px-2"
                    style="
                      opacity: var(--v-medium-emphasis-opacity);
                      font-size: 12px;
                    "
                  >
                    {{ item?.label }}
                  </span>
                  <v-slider
                    v-model="userdata[item.property]"
                    :min="0"
                    :max="100"
                    hide-details
                    :thumb-size="15"
                    :track-size="1"
                  />
                </div>
                <div v-else class="text-error">
                  Type "{{ item?.type }}" invalid!
                </div>
              </div>
            </div>
          </template>
        </v-card-text>
        <v-card-subtitle class="text-center">
          <small>{{ block.name }}</small>
        </v-card-subtitle>
      </v-card>
    </v-slide-group-item>
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
      { label: "DIN Condensed", value: "DINCondensedBold, sans-serif" },
      { label: "Roboto", value: "Roboto, sans-serif" },
    ],
  }),
  computed: {
    menu_items() {
      return [
        ...this.items.map((block) => {
          return this.toBlock(block);
        }),
        {
          name: this.$t("components.customization.restore"),
          items: [
            [
              {
                type: "restore",
                label: this.$t("components.customization.restore_configs"),
              },
            ],
          ],
        },
      ];
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
    fit() {
      return [
        { label: this.$t("components.customization.fit.none"), value: "none" },
        { label: this.$t("components.customization.fit.fill"), value: "fill" },
        {
          label: this.$t("components.customization.fit.contain"),
          value: "contain",
        },
        {
          label: this.$t("components.customization.fit.cover"),
          value: "cover",
        },
      ];
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
    restore() {
      let self = this;
      this.$alert.yesno(
        "components.customization.restore_dialog",
        function (btn) {
          if (btn == "yes") {
            self.menu_items?.map((block) => {
              block.items?.map((group) => {
                group.map((item) => {
                  if (item.property) {
                    self.userdata[item.property] = item.default;
                  }
                });
              });
            });
          }
        },
      );
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
