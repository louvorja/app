<template>
  <v-bottom-navigation
    v-if="Object.keys(module_group).length > 1"
    v-model="activeGroupKey"
    id="bottom-nav"
    color="white"
    bg-color="primary"
    grow
  >
    <v-btn
      v-for="(group, group_key) in module_group"
      :key="group_key"
      :value="group_key"
      :icon="groupIcon(group_key)"
    >
      <v-icon :icon="groupIcon(group_key)" />
      <span class="text-caption">{{ $t(group.title) }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script>
export default {
  name: "BottomNavLayout",
  computed: {
    module_group() {
      return Object.entries(this.$modules.getGroups())
        .filter(([, value]) => Object.keys(value.modules).length > 0)
        .reduce((result, [key, value]) => {
          result[key] = value;
          return result;
        }, {});
    },
    activeGroupKey: {
      get() {
        return this.$appdata.get("mobile_active_group") || Object.keys(this.module_group)[0];
      },
      set(value) {
        this.$appdata.set("mobile_active_group", value);
      },
    },
  },
  methods: {
    groupIcon(group_key) {
      return (
        {
          musics: "mdi-music-note",
          bible: "mdi-book-cross",
          planning: "mdi-calendar-check-outline",
          utilities: "mdi-toolbox-outline",
        }[group_key] || "mdi-apps"
      );
    },
  },
};
</script>

<style scoped>
#bottom-nav {
  height: calc(56px + var(--safe-bottom)) !important;
  padding-bottom: var(--safe-bottom);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}
</style>
