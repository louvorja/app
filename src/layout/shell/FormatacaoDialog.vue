<template>
  <v-dialog v-model="visible" max-width="1100" scrollable persistent>
    <v-card class="format-card">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-format-paint" size="22" class="mr-2" />
        <span>{{ $t("formatacao.title") }}</span>
        <v-spacer />
        <v-btn variant="text" icon="mdi-close" size="small" @click="cancel" />
      </v-card-title>
      <v-divider />

      <v-card-text class="format-body pa-0">
        <!-- Lista de itens formatáveis -->
        <nav class="format-sidebar">
          <button
            v-for="entry in entries"
            :key="entry.id"
            type="button"
            class="format-item"
            :class="{ 'format-item--active': activeId === entry.id }"
            @click="activeId = entry.id"
          >
            <v-icon :icon="entry.icon" size="18" />
            <span class="format-item-label">{{ entry.label }}</span>
          </button>
        </nav>

        <!-- Painel de edição -->
        <section class="format-content">
          <header class="format-content-header">
            <h3>{{ activeEntry?.label }}</h3>
            <p v-if="activeEntry?.hint" class="text-medium-emphasis">{{ activeEntry.hint }}</p>
          </header>

          <!-- Edição de slides (storage especial em options.slides) -->
          <div v-if="activeEntry?.kind === 'slides'" class="format-fields">
            <SlideFormatFields />
          </div>

          <!-- Edição de módulo (CustomizationTools original) -->
          <div v-else-if="activeEntry?.kind === 'module'" class="format-fields">
            <CustomizationTools
              :module="activeEntry.module"
              :items="activeEntry.fields"
              class="format-tools"
            />
          </div>

          <div v-else class="format-empty">
            {{ $t("formatacao.empty") }}
          </div>
        </section>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-3">
        <v-btn variant="text" @click="restore">
          <v-icon icon="mdi-restore" size="18" class="mr-1" />
          {{ $t("formatacao.restore") }}
        </v-btn>

        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" variant="text">
              <v-icon icon="mdi-content-save-cog" size="18" class="mr-1" />
              {{ $t("formatacao.profiles") }}
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-content-save-plus"
              :title="$t('formatacao.profile_save')"
              @click="saveProfile"
            />
            <v-divider v-if="profiles.length" />
            <v-list-item
              v-for="p in profiles"
              :key="p.name"
              prepend-icon="mdi-folder-open"
              :title="p.name"
              @click="loadProfile(p)"
            >
              <template #append>
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  variant="text"
                  @click.stop="deleteProfile(p)"
                />
              </template>
            </v-list-item>
            <v-divider />
            <v-list-item
              prepend-icon="mdi-export"
              :title="$t('formatacao.export')"
              @click="exportJson"
            />
            <v-list-item
              prepend-icon="mdi-import"
              :title="$t('formatacao.import')"
              @click="importJson"
            />
          </v-list>
        </v-menu>

        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          style="display: none"
          @change="onFileSelected"
        />

        <v-spacer />
        <v-btn variant="text" @click="cancel">{{ $t("formatacao.cancel") }}</v-btn>
        <v-btn color="primary" variant="flat" @click="save">{{ $t("formatacao.save") }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import CustomizationTools from "@/components/CustomizationTools.vue";
import SlideFormatFields from "@/layout/shell/SlideFormatFields.vue";
import $appdata from "@/helpers/AppData";
import $userdata from "@/helpers/UserData";
import $alert from "@/helpers/Alert";
import { SLIDE_DEFAULTS } from "@/composables/useSlideStyle";

const { t } = useI18n();

const visible = computed({
  get: () => $appdata.get("ui.formatacao_open") === true,
  set: (v) => $appdata.set("ui.formatacao_open", v),
});

const activeId = ref("slides");

// Snapshot tirado quando a dialog abre — usado para Cancelar e reverter.
let _snapshot = null;

watch(visible, (v) => {
  if (v) {
    // Salva snapshot bruto do JSON; restore() faz deep set de cada chave.
    _snapshot = {
      slides: JSON.parse(JSON.stringify($userdata.get("options.slides", {}) ?? {})),
      modules: JSON.parse(JSON.stringify($userdata.get("modules", {}) ?? {})),
    };
  }
});

// Lista de módulos com customization no manifest. Usa $appdata.modules
// (preenchido pelo ModuleManager). Filtra módulos sem render visual
// (dev, transmission, update, downloads, remote_control, slide_editor, theme).
const HIDDEN = new Set([
  "dev",
  "transmission",
  "update",
  "downloads",
  "remote_control",
  "slide_editor",
  "theme",
  "media",
  "lyric",
  "album",
  "favorites",
  "history",
  "hymnal",
  "musics",
  "collections",
  "liturgy",
  "bible_search",
  "animation",
  "base_module",
  "operator",
  "remote_control",
]);

const moduleEntries = computed(() => {
  const all = $appdata.get("modules") || {};
  return Object.values(all)
    .filter((m) => m && m.manifest?.customization && !HIDDEN.has(m.id))
    .map((m) => ({
      id: `module:${m.id}`,
      kind: "module",
      icon: m.manifest?.icon || m.icon || "mdi-puzzle",
      label:
        t(`modules.${m.id}.title`) !== `modules.${m.id}.title`
          ? t(`modules.${m.id}.title`)
          : m.manifest?.name || m.id,
      module: m,
      fields: Object.keys(m.manifest.customization),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const entries = computed(() => [
  {
    id: "slides",
    kind: "slides",
    icon: "mdi-music-note",
    label: t("formatacao.slides_title"),
    hint: t("formatacao.slides_hint"),
  },
  ...moduleEntries.value,
]);

const activeEntry = computed(() => entries.value.find((e) => e.id === activeId.value) || null);

function cancel() {
  if (_snapshot) {
    $userdata.set("options.slides", _snapshot.slides);
    $userdata.set("modules", _snapshot.modules);
  }
  visible.value = false;
}

function save() {
  // Mudanças já estão persistidas (CustomizationTools grava on-change).
  _snapshot = null;
  visible.value = false;
}

function restore() {
  $alert.yesno("formatacao.restore_confirm", (btn) => {
    if (btn !== "yes") return;
    if (activeEntry.value?.kind === "slides") {
      $userdata.set("options.slides", { ...SLIDE_DEFAULTS });
    } else if (activeEntry.value?.kind === "module") {
      const m = activeEntry.value.module;
      Object.entries(m.manifest.customization).forEach(([key, def]) => {
        $userdata.set(`modules.${m.id}.${key}`, def.default);
      });
    }
  });
}

// ─── Perfis ──────────────────────────────────────────────────────────────
const profiles = computed(() => $userdata.get("profiles", []) ?? []);
const fileInput = ref(null);

function _currentSnapshot() {
  return {
    version: 1,
    created_at: new Date().toISOString(),
    slides: $userdata.get("options.slides", {}) ?? {},
    modules: Object.fromEntries(
      moduleEntries.value.map((e) => [
        e.module.id,
        $userdata.get(`modules.${e.module.id}`, {}) ?? {},
      ])
    ),
  };
}

function _applySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  if (snapshot.slides) $userdata.set("options.slides", snapshot.slides);
  if (snapshot.modules) {
    Object.entries(snapshot.modules).forEach(([id, val]) => {
      $userdata.set(`modules.${id}`, val);
    });
  }
}

function saveProfile() {
  const name = window.prompt(t("formatacao.profile_name_prompt"));
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  const snap = _currentSnapshot();
  const existing = profiles.value.filter((p) => p.name !== trimmed);
  $userdata.set("profiles", [...existing, { name: trimmed, ...snap }]);
}

function loadProfile(p) {
  $alert.yesno("formatacao.profile_load_confirm", (btn) => {
    if (btn !== "yes") return;
    _applySnapshot(p);
  });
}

function deleteProfile(p) {
  $alert.yesno("formatacao.profile_delete_confirm", (btn) => {
    if (btn !== "yes") return;
    $userdata.set(
      "profiles",
      profiles.value.filter((x) => x.name !== p.name)
    );
  });
}

function exportJson() {
  const snap = _currentSnapshot();
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `louvorja-formatacao-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson() {
  fileInput.value?.click();
}

function onFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(String(ev.target.result));
      _applySnapshot(data);
    } catch (err) {
      $alert.error({ text: "formatacao.import_error", error: err });
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}
</script>

<style scoped>
.format-card {
  height: min(720px, 90vh);
  display: flex;
  flex-direction: column;
  font-family: var(--lj-font-shell);
}

.format-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.format-sidebar {
  flex: 0 0 240px;
  min-width: 240px;
  border-right: 1px solid var(--lj-surface-border);
  overflow-y: auto;
  background: var(--lj-surface-bg-soft);
  padding: var(--lj-space-2) 0;
}

.format-item {
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  width: 100%;
  padding: var(--lj-space-3) var(--lj-space-4);
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--lj-text-base);
  color: var(--lj-text);
  text-align: left;
  border-left: 3px solid transparent;
  transition: background var(--lj-transition-fast);
}

.format-item:hover {
  background: var(--lj-hover-bg);
}

.format-item--active {
  background: var(--lj-surface-bg);
  border-left-color: var(--lj-navy);
  font-weight: var(--lj-weight-medium);
}

.format-item-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.format-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--lj-space-5);
  min-width: 0;
}

.format-content-header {
  margin-bottom: var(--lj-space-4);
}

.format-content-header h3 {
  font-size: var(--lj-text-lg);
  font-weight: var(--lj-weight-semibold);
  margin: 0 0 var(--lj-space-1);
}

.format-content-header p {
  font-size: var(--lj-text-sm);
  margin: 0;
}

.format-fields {
  background: var(--lj-surface-bg-soft);
  border: 1px solid var(--lj-surface-border);
  border-radius: var(--lj-radius-md);
  padding: var(--lj-space-3);
}

.format-empty {
  padding: var(--lj-space-6);
  text-align: center;
  color: var(--lj-text-muted);
}
</style>
