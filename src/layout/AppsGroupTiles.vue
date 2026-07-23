<template>
  <div class="d-flex flex-wrap lj-tile-wrap" :class="{ 'lj-tile-wrap--grid': grid }">
    <template v-for="(module, module_key) in sortModules(modules)" :key="module_key">
      <v-card
        v-if="
          module.language
            ? module.language == language
            : !module.development || (is_dev && module.development)
        "
        :color="
          module.invalid ? 'error' : module.development ? 'warning' : color
        "
        @click="$modules.open(module_key)"
        class="ma-1 lj-app-tile"
        :class="{ 'lj-app-tile--grid': grid }"
        :width="grid ? undefined : 140"
        rounded="xl"
      >
        <v-card-text class="d-flex flex-column align-center justify-center h-100 px-0">
          <v-icon :icon="module.icon" color="#FFFFFF" :size="grid ? 32 : 40" style="flex: 1" />
          <v-card-title class="text-center font-weight-light text-title-small" style="text-wrap: initial">
            <small>{{ module.title ? $t(module.title) : "" }}</small>
          </v-card-title>
        </v-card-text>
      </v-card>
    </template>

    <!-- LouvorJ.AI não é um módulo (é o painel global de chat), mas
         mora visualmente junto dos Utilitários, como pedido. -->
    <v-card
      v-if="groupKey === 'utilities'"
      :color="color"
      @click="$appdata.toogle('chatbot_open')"
      class="ma-1 lj-app-tile"
      :class="{ 'lj-app-tile--grid': grid }"
      :width="grid ? undefined : 140"
      rounded="xl"
    >
      <v-card-text class="d-flex flex-column align-center justify-center h-100 px-0">
        <v-icon icon="mdi-robot-outline" color="#FFFFFF" :size="grid ? 32 : 40" style="flex: 1" />
        <v-card-title class="text-center font-weight-light text-title-small" style="text-wrap: initial">
          <small>{{ $t("chatbot.name") }}</small>
        </v-card-title>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "AppsGroupTiles",
  props: {
    modules: {
      type: Object,
      required: true,
    },
    groupKey: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    // No mobile, os tiles usam uma grade responsiva (mais parecida com um
    // launcher de app) em vez do flex-wrap de largura fixa do desktop.
    grid: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    is_dev() {
      return this.$appdata.get("is_dev");
    },
    language() {
      return this.$userdata.get("language");
    },
  },
  methods: {
    sortModules(modules) {
      return this.$modules.sort(modules, this.$t);
    },
  },
};
</script>

<style scoped>
.lj-tile-wrap {
  gap: 5px;
}

.lj-tile-wrap--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 10px;
}

:deep(.lj-app-tile) {
  background-image: linear-gradient(
    150deg,
    rgba(255, 255, 255, 0.22) 0%,
    rgba(255, 255, 255, 0) 55%
  );
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
}

:deep(.lj-app-tile--grid) {
  margin: 0 !important;
  width: 100%;
  aspect-ratio: 1;
}

:deep(.lj-app-tile:hover) {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.26);
}
</style>
