<template>
  <v-card v-for="(module, key) in modules" :key="key" class="ma-2">
    <div class="d-flex flex-no-wrap justify-space-between">
      <v-avatar class="ma-3" rounded="0" size="50">
        <v-icon :icon="module.icon" />
      </v-avatar>

      <div class="w-100">
        <v-card-title class="pa-0">
          {{ module.manifest.name }}
          <v-chip color="green" size="small" class="ma-1">
            {{ module.manifest.id }}
          </v-chip>
          <v-chip
            v-if="module.manifest.system"
            color="red"
            size="small"
            class="ma-1"
          >
            system module
          </v-chip>
        </v-card-title>

        <v-card-text class="px-0 py-1">
          {{ module.manifest.description }}
        </v-card-text>
        <v-card-text
          class="pa-0"
          v-if="module.manifest.dependencies.length > 0"
        >
          <b>Dependencies:</b>
          <v-chip
            v-for="(dependency, key) in module.manifest.dependencies"
            :key="key"
            color="orange"
            size="small"
            class="ma-1"
            label
          >
            {{ dependency }}
          </v-chip>
        </v-card-text>

        <v-card-actions>
          <v-chip
            v-if="module.manifest.category"
            color="info"
            size="small"
            class="ma-1"
          >
            {{ module.manifest.category }}
          </v-chip>
          <v-chip v-else color="info" size="small">no-category</v-chip>
          <v-chip
            v-if="module.manifest.development"
            color="red"
            size="small"
            class="ma-1"
          >
            development
          </v-chip>
          <v-chip
            v-if="module.manifest.showInMainMenu"
            color="orange"
            size="small"
            class="ma-1"
          >
            menu
          </v-chip>
        </v-card-actions>
      </div>
    </div>
  </v-card>
</template>

<script>
export default {
  name: "ModuleList",
  computed: {
    modules() {
      return this.$appdata.get("modules");
    },
  },
};
</script>
