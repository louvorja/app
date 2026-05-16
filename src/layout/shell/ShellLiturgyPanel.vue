<template>
  <aside class="liturgy-panel" :class="{ 'liturgy-panel--collapsed': collapsed }">
    <div class="liturgy-panel-header">
      <button
        type="button"
        class="liturgy-icon-btn"
        :title="$t('shell.toggle_liturgy')"
        :aria-label="$t('shell.toggle_liturgy')"
        @click="toggleCollapsed"
      >
        <v-icon :icon="collapsed ? 'mdi-chevron-left' : 'mdi-chevron-right'" size="16" />
      </button>
      <v-icon icon="mdi-script" size="14" class="liturgy-header-icon" />
      <span class="liturgy-header-title lj-u-truncate">{{ $t("shell.liturgy_title") }}</span>
      <span v-if="!collapsed && totals.count > 0" class="liturgy-totals">
        {{ totals.count }} · {{ totals.duration }}
      </span>
      <button
        v-if="!collapsed"
        type="button"
        class="liturgy-icon-btn"
        :title="$t('shell.edit_liturgy')"
        :aria-label="$t('shell.edit_liturgy')"
        @click="openLiturgy"
      >
        <v-icon icon="mdi-pencil" size="13" />
      </button>
    </div>

    <div v-if="!collapsed" class="liturgy-panel-body">
      <div v-if="items.length === 0" class="liturgy-empty">
        <v-icon icon="mdi-calendar-blank-outline" size="32" class="mb-2" />
        <span>{{ $t("shell.liturgy_empty") }}</span>
        <button type="button" class="liturgy-add-btn" @click="openLiturgy">
          <v-icon icon="mdi-plus" size="14" />
          {{ $t("shell.add_item") }}
        </button>
      </div>

      <ul v-else class="liturgy-items">
        <li
          v-for="item in items"
          :key="item.id"
          class="liturgy-item"
          :class="{ 'liturgy-item--checked': isChecked(item) }"
          :style="{ '--item-color': item.cor || '#4F0000' }"
          @click="executeItem(item)"
          @dblclick="openLiturgy"
        >
          <span class="liturgy-item-bar" />
          <v-icon :icon="iconForType(item.tipo)" size="14" class="liturgy-item-icon" />
          <span class="liturgy-item-content">
            <span class="liturgy-item-title lj-u-truncate">
              {{ item.item || item.subitem || "—" }}
            </span>
            <span v-if="item.subitem && item.subitem !== item.item" class="liturgy-item-sub">
              {{ item.subitem }}
            </span>
          </span>
          <span v-if="Number(item.duration) > 0" class="liturgy-item-duration">
            {{ item.duration }}m
          </span>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Liturgy from "@/helpers/Liturgy";
import $userdata from "@/helpers/UserData";
import $modules from "@/helpers/Modules";
import $media from "@/composables/useMedia";

const TYPE_ICONS = {
  musica: "mdi-music",
  anotacao: "mdi-note-text-outline",
  arquivo: "mdi-file-outline",
  site: "mdi-web",
  categoria: "mdi-folder-outline",
  itensagendados: "mdi-calendar-clock",
};

const collapsed = ref(false);

const items = computed(() => Liturgy.list());

const totals = computed(() => {
  const arr = items.value;
  const count = arr.length;
  const totalMin = arr.reduce((s, i) => s + (Number(i.duration) || 0), 0);
  let duration = "—";
  if (totalMin > 0) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    duration = h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${m}m`;
  }
  return { count, duration };
});

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  $userdata.set("shell.liturgy_collapsed", collapsed.value);
}

function iconForType(tipo) {
  return TYPE_ICONS[tipo] || "mdi-circle-small";
}

function isChecked(item) {
  return Liturgy.isCheckedToday(item);
}

function openLiturgy() {
  $modules.open("liturgy");
}

function executeItem(item) {
  if (item.tipo === "musica" && item.id_music) {
    try {
      $media.open({
        id_music: item.id_music,
        mode: item.subtipo === "ja" ? "audio" : undefined,
      });
    } catch (err) {
      console.error("[Liturgy] Falha ao abrir música:", err);
    }
    return;
  }
  if (item.tipo === "site" && item.url) {
    if (typeof window !== "undefined") window.open(item.url, "_blank", "noopener,noreferrer");
    return;
  }
  openLiturgy();
}

onMounted(() => {
  collapsed.value = $userdata.get("shell.liturgy_collapsed", false);
});
</script>

<style scoped>
.liturgy-panel {
  width: var(--lj-sidebar-width);
  flex-shrink: 0;
  background: var(--lj-surface-bg-soft);
  border-left: 1px solid var(--lj-surface-border);
  display: flex;
  flex-direction: column;
  color: var(--lj-text);
  overflow: hidden;
  transition: width var(--lj-transition-slow);
  font-family: var(--lj-font-shell);
}

.liturgy-panel--collapsed {
  width: var(--lj-sidebar-collapsed);
}

/* Header */
.liturgy-panel-header {
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  height: var(--lj-tab-height);
  padding: 0 var(--lj-space-3);
  background: var(--lj-surface-bg);
  border-bottom: 1px solid var(--lj-surface-border);
  font-size: var(--lj-text-base);
  font-weight: var(--lj-weight-semibold);
  flex-shrink: 0;
  user-select: none;
}

.liturgy-icon-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--lj-radius-xs);
  cursor: pointer;
  color: inherit;
  opacity: 0.65;
  transition:
    background var(--lj-transition-fast),
    opacity var(--lj-transition-fast);
  font-family: inherit;
}

.liturgy-icon-btn:hover {
  background: var(--lj-hover-bg);
  opacity: 1;
}

.liturgy-header-icon {
  opacity: 0.7;
}

.liturgy-header-title {
  flex: 1;
}

.liturgy-totals {
  font-size: var(--lj-text-sm);
  font-weight: var(--lj-weight-medium);
  opacity: 0.75;
  font-variant-numeric: tabular-nums;
}

/* Body */
.liturgy-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--lj-space-2) var(--lj-space-3) var(--lj-space-5);
}

.liturgy-panel-body::-webkit-scrollbar {
  width: 6px;
}
.liturgy-panel-body::-webkit-scrollbar-thumb {
  background: var(--lj-scrollbar-thumb-bg);
  border-radius: 3px;
}

/* Empty state */
.liturgy-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px var(--lj-space-5);
  text-align: center;
  font-size: var(--lj-text-base);
  color: var(--lj-text-muted);
  gap: var(--lj-space-1);
}

.liturgy-add-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--lj-space-1);
  margin-top: var(--lj-space-5);
  padding: var(--lj-space-2) var(--lj-space-5);
  background: var(--lj-navy);
  color: var(--lj-white);
  border: none;
  border-radius: var(--lj-radius-sm);
  font-size: var(--lj-text-sm);
  cursor: pointer;
  transition: filter var(--lj-transition-fast);
  font-family: inherit;
}

.liturgy-add-btn:hover {
  filter: brightness(1.1);
}

/* Items */
.liturgy-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--lj-space-1);
}

.liturgy-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  padding: var(--lj-space-2) var(--lj-space-4) var(--lj-space-2) var(--lj-space-6);
  background: var(--lj-surface-bg);
  border: 1px solid var(--lj-surface-border);
  border-radius: var(--lj-radius-sm);
  cursor: pointer;
  transition:
    background var(--lj-transition-fast),
    border-color var(--lj-transition-fast),
    transform 0.05s;
  font-size: var(--lj-text-base);
  user-select: none;
}

.liturgy-item:hover {
  background: var(--lj-surface-bg-hover);
  border-color: var(--lj-surface-border-strong);
}

.liturgy-item:active {
  transform: scale(0.985);
}

.liturgy-item-bar {
  position: absolute;
  left: 0;
  top: var(--lj-space-2);
  bottom: var(--lj-space-2);
  width: 3px;
  background: var(--item-color);
  border-radius: 0 var(--lj-radius-xs) var(--lj-radius-xs) 0;
}

.liturgy-item-icon {
  opacity: 0.7;
  flex-shrink: 0;
}

.liturgy-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.liturgy-item-title {
  font-weight: var(--lj-weight-medium);
  line-height: 1.25;
}

.liturgy-item-sub {
  font-size: var(--lj-text-xs);
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.liturgy-item-duration {
  font-size: var(--lj-text-xs);
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
  flex-shrink: 0;
}

.liturgy-item--checked {
  opacity: 0.55;
}
.liturgy-item--checked .liturgy-item-title {
  text-decoration: line-through;
}
</style>
