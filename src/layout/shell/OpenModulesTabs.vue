<template>
  <div
    v-if="openModules.length > 0"
    class="subtabs"
    role="tablist"
    :aria-label="$t('shell.open_modules')"
  >
    <button
      v-for="m in openModules"
      :key="m.id"
      type="button"
      role="tab"
      class="subtab"
      :class="{ 'subtab--active': isActive(m.id) }"
      :aria-selected="isActive(m.id)"
      @click="focus(m.id)"
    >
      <v-icon :icon="iconFor(m.id)" size="13" class="subtab-icon" aria-hidden="true" />
      <span class="subtab-label lj-u-truncate">{{ labelFor(m.id) }}</span>
      <span
        role="button"
        tabindex="-1"
        class="subtab-close"
        :aria-label="`${$t('alert.close')}: ${labelFor(m.id)}`"
        @click.stop="close(m.id)"
      >
        <v-icon icon="mdi-close" size="11" aria-hidden="true" />
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { MODULE_ICONS } from "./ribbon-pages.js";
import $appdata from "@/helpers/AppData";
import $modules from "@/helpers/Modules";

const { t } = useI18n();

const openModules = computed(() => {
  const modules = $appdata.get("modules") || {};
  const skip = new Set(["media", "lyric", "album"]);
  return Object.values(modules).filter(
    (m) => m && m.show === true && !skip.has(m.id) && m.popup !== true
  );
});

function isActive(id) {
  return $appdata.get("active_module") === id;
}

function iconFor(id) {
  return MODULE_ICONS[id] || "mdi-application";
}

function labelFor(id) {
  const key = `modules.${id}.title`;
  const translated = t(key);
  return translated === key ? id.replace(/_/g, " ") : translated;
}

function focus(id) {
  $modules.open(id);
}
function close(id) {
  $modules.close(id);
}
</script>

<style scoped>
.subtabs {
  display: flex;
  align-items: flex-end;
  height: var(--lj-subtabs-height);
  padding: 0 var(--lj-space-2);
  background: var(--lj-subtabs-bg);
  border-bottom: 1px solid var(--lj-subtabs-border);
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  font-family: var(--lj-font-shell);
}

.subtabs::-webkit-scrollbar {
  display: none;
}

.subtab {
  display: flex;
  align-items: center;
  gap: var(--lj-space-2);
  padding: 0 var(--lj-space-2) 0 var(--lj-space-4);
  background: var(--lj-subtab-bg);
  border: 1px solid var(--lj-subtabs-border);
  border-bottom: none;
  border-radius: var(--lj-radius-tab);
  margin-right: 2px;
  cursor: pointer;
  font-size: var(--lj-text-base);
  color: var(--lj-subtab-color);
  outline: none;
  transition:
    background var(--lj-transition-fast),
    color var(--lj-transition-fast),
    border-color var(--lj-transition-fast);
  white-space: nowrap;
  font-family: inherit;
  height: calc(var(--lj-subtabs-height) - 4px);
  position: relative;
}

.subtab:hover:not(.subtab--active) {
  background: var(--lj-subtab-hover-bg);
  color: var(--lj-text);
}

.subtab--active {
  background: var(--lj-subtab-active-bg);
  color: var(--lj-subtab-active-color);
  font-weight: var(--lj-weight-semibold);
  border-color: var(--lj-subtabs-border);
  z-index: 2;
  height: var(--lj-subtabs-height);
  margin-bottom: -1px;
  padding-bottom: 1px;
}

.subtab--active::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: var(--lj-navy);
  border-radius: var(--lj-radius-tab) var(--lj-radius-tab) 0 0;
}

.subtab-icon {
  opacity: 0.85;
  flex-shrink: 0;
}

.subtab-label {
  max-width: 200px;
}

.subtab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: var(--lj-radius-xs);
  margin-left: var(--lj-space-1);
  color: var(--lj-subtab-close-color);
  opacity: 0.85;
  transition:
    opacity var(--lj-transition-fast),
    background var(--lj-transition-fast);
}

.subtab-close:hover {
  opacity: 1;
  background: var(--lj-subtab-close-hover-bg);
  color: var(--lj-orange-dark);
}
</style>
