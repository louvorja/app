<template>
  <div class="apps-ribbon bg-light">
    <div class="d-flex align-center h-100 px-6 overflow-x-auto no-scrollbar">
      <template v-if="activeModuleGroup && activeModuleGroup.modules">
        <transition-group name="fade-slide" tag="div" class="d-flex">
          <div
            v-for="(module, module_key) in sortModules(
              activeModuleGroup.modules,
            )"
            :key="module_key"
            class="module-item text-center d-flex flex-column align-center justify-center cursor-pointer"
            @click="$modules.open(module_key)"
          >
            <div class="icon-container mb-1">
              <v-icon
                :icon="module.icon"
                size="32"
                :color="module.color || '#555'"
              />
            </div>
            <div class="module-title text-caption">
              {{ module.title ? $t(module.title) : "" }}
            </div>
          </div>
        </transition-group>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: "AppsLayout",
  computed: {
    active_group() {
      return this.$appdata.get("active_group");
    },
    activeModuleGroup() {
      const groups = this.$modules.getGroups();
      return groups[this.active_group] || null;
    },
    is_dev() {
      return this.$appdata.get("is_dev");
    },
    language() {
      return this.$userdata.get("language");
    },
  },
  methods: {
    sortModules(modules) {
      const filtered = Object.fromEntries(
        Object.entries(modules).filter(([, module]) => {
          const devMatch =
            !module.development || (this.is_dev && module.development);
          const langMatch =
            !module.language || module.language == this.language;
          return devMatch && langMatch;
        }),
      );
      return this.$modules.sort(filtered, this.$t);
    },
  },
};
</script>

<style scoped>
.apps-ribbon {
  height: 90px;
  width: 100%;
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 2px solid rgb(var(--v-theme-primary));
  box-shadow: 0 4px 6px -4px rgba(0, 0, 0, 0.2);
  flex: 0 0 auto;
}

.module-item {
  min-width: 110px;
  height: 80px;
  padding: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
}

.module-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
  transform: translateY(-2px);
}

.icon-container {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.module-title {
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
  font-weight: 500;
  max-width: 90px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
