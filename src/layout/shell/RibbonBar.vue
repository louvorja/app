<template>
  <div class="ribbon">
    <!-- Linha de tabs -->
    <div class="ribbon-tabs-row">
      <AppMenuButton class="ribbon-app-menu" />

      <div class="ribbon-tabs" role="tablist" :aria-label="$t('shell.ribbon_nav')">
        <button
          v-for="page in visiblePages"
          :id="'ribbon-tab-' + page.id"
          :key="page.id"
          type="button"
          role="tab"
          class="ribbon-tab"
          :class="{
            'ribbon-tab--active': activePage === page.id,
            'ribbon-tab--ctx': page.contextual,
            'ribbon-tab--ctx-active': page.contextual && activePage === page.id,
          }"
          :aria-selected="activePage === page.id"
          aria-controls="ribbon-tabpanel"
          @click.stop="selectPage(page.id)"
        >
          {{ $t(page.title) }}
        </button>
      </div>

      <div class="ribbon-tools">
        <button
          type="button"
          class="ribbon-tool ribbon-tool--text"
          :title="$t('shell.quick_search')"
          @click="onOpenCommandPalette"
        >
          <v-icon icon="mdi-magnify" size="14" />
          <span>{{ $t("shell.quick_search_short") }}</span>
        </button>
        <button
          type="button"
          class="ribbon-tool"
          :title="$t('ribbon.btn.favorites')"
          :aria-label="$t('ribbon.btn.favorites')"
          @click="$modules.open('favorites')"
        >
          <v-icon icon="mdi-star" size="16" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="ribbon-tool"
          :title="$t('shell.toggle_theme')"
          :aria-label="$t('shell.toggle_theme')"
          @click="toggleTheme"
        >
          <v-icon
            :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            size="16"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          class="ribbon-tool"
          :title="$t('shell.appmenu_items.about')"
          :aria-label="$t('shell.appmenu_items.about')"
          @click="onOpenAbout"
        >
          <v-icon icon="mdi-information-outline" size="16" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="ribbon-tool"
          :title="$t('hotkeys.title')"
          :aria-label="$t('hotkeys.title')"
          @click="onOpenHotkeys"
        >
          <v-icon icon="mdi-help-circle-outline" size="16" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div
      id="ribbon-tabpanel"
      class="ribbon-body"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="'ribbon-tab-' + activePage"
      :class="{ 'ribbon-body--ctx': isContextualActive }"
    >
      <RibbonGroup
        v-for="group in activeGroups"
        :key="`${activePage}:${group.id}`"
        :title="$t(group.title)"
      >
        <template v-for="btn in group.buttons" :key="`${activePage}:${group.id}:${btn.id}`">
          <RibbonScreenButton
            v-if="btn.type === 'screen'"
            :feature="btn.feature"
            :route="btn.route"
            :icon="btn.icon"
            :icon-color="btn.color"
            :label="$t(btn.label)"
            :size="btn.size || 'large'"
            :testid="`ribbon-btn-${btn.id}`"
          />
          <RibbonButton
            v-else
            :icon="btn.icon"
            :icon-color="btn.color"
            :label="$t(btn.label)"
            :size="btn.size || 'large'"
            :active="isButtonActive(btn)"
            :testid="`ribbon-btn-${btn.id}`"
            @click="executeButton(btn)"
          />
        </template>
      </RibbonGroup>
      <div v-if="activeGroups.length === 0" class="ribbon-empty">
        {{ $t("shell.empty_ribbon_page") }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";
import RibbonGroup from "./RibbonGroup.vue";
import RibbonButton from "./RibbonButton.vue";
import RibbonScreenButton from "./RibbonScreenButton.vue";
import AppMenuButton from "./AppMenuButton.vue";
import { useShell } from "@/composables/useShell";
import { RIBBON_PAGES } from "./ribbon-pages.js";
import $appdata from "@/helpers/AppData";
import $userdata from "@/helpers/UserData";
import $modules from "@/helpers/Modules";
import $alert from "@/helpers/Alert";
import Broadcast from "@/helpers/Broadcast";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";

const { t } = useI18n();
const theme = useTheme();
const shell = useShell();

const activePage = ref("collections");

const isDark = computed(() => $appdata.get("is_dark", false));

const activeModuleId = computed(() => $appdata.get("active_module"));

const openModuleIds = computed(() => {
  const modules = $appdata.get("modules") || {};
  return Object.keys(modules).filter((id) => modules[id]?.show === true);
});

const visiblePages = computed(() =>
  RIBBON_PAGES.filter((p) => {
    if (!p.contextual) return true;
    if (!activeModuleId.value) return false;

    return (p.activeOnModules || []).includes(activeModuleId.value);
  })
);

const activePageObj = computed(() => RIBBON_PAGES.find((p) => p.id === activePage.value));
const activeGroups = computed(() => activePageObj.value?.groups || []);
const isContextualActive = computed(() => !!activePageObj.value?.contextual);

function selectContextualPageForModule(moduleId) {
  if (!moduleId) return;

  const ctxPage = RIBBON_PAGES.find(
    (p) => p.contextual && (p.activeOnModules || []).includes(moduleId)
  );

  if (ctxPage) {
    activePage.value = ctxPage.id;
  }
}

watch(openModuleIds, (now) => {
  const cur = activePageObj.value;

  if (cur?.contextual) {
    const stillVisible = (cur.activeOnModules || []).some((id) => now.includes(id));

    if (!stillVisible) {
      activePage.value = "collections";
    }
  }
});

watch(activeModuleId, (moduleId) => {
  selectContextualPageForModule(moduleId);
});

function selectPage(id) {
  activePage.value = id;
  const page = RIBBON_PAGES.find((p) => p.id === id);
  if (page?.defaultModule) $modules.open(page.defaultModule);
}

function isModuleOpen(moduleId) {
  return moduleId ? openModuleIds.value.includes(moduleId) : false;
}

// Quando dois botões mapeiam ao mesmo módulo (ex.: stopwatch_culto/stopwatch
// ou diverse/personal), só o último botão clicado fica destacado.
function isButtonActive(btn) {
  if (!btn.module) return false;
  if (!openModuleIds.value.includes(btn.module)) return false;
  const lastBtn = $appdata.get(`modules.${btn.module}.last_btn`);
  // Se nenhum botão registrado ainda, considera ativo só botões sem irmãos
  if (!lastBtn) return true;
  return lastBtn === btn.id;
}

const LITURGY_ACTIONS = {
  lit_add_item: "add",
  lit_check_all: "check_all",
  lit_uncheck_all: "uncheck_all",
  lit_invert: "invert",
  lit_delete: "delete_selected",
  lit_mark_done: "toggle_mark_on_access",
  lit_show_notes: "toggle_show_notes",
  lit_lock: "toggle_lock",
};

const BIBLE_ACTIONS = {
  bible_clear: "clear",
  bible_prev_verse: "prev_verse",
  bible_next_verse: "next_verse",
  bible_format: "toggle_format",
  bible_restore: "restore",
};

const EDITOR_ACTIONS = new Set([
  "editor_new",
  "editor_open",
  "editor_save",
  "editor_save_as",
  "editor_import_txt",
  "editor_project",
  "editor_new_slide",
  "editor_duplicate_slide",
  "editor_remove_slide",
  "editor_split_slide",
  "editor_merge_next",
  "editor_first",
  "editor_prev",
  "editor_next",
  "editor_last",
  "editor_audio_attach",
  "editor_audio_remove",
  "editor_play_pause",
  "editor_record_advance",
  "editor_record_start",
  "editor_record_retroactive",
  "editor_record_clear",
  "editor_view_full",
  "editor_view_4_3",
  "editor_view_16_9",
]);

function executeButton(btn) {
  if (btn.module) {
    // Marca qual botão originou a abertura — evita destacar todos os botões
    // que mapeiam ao mesmo módulo (collections "Diversas" vs "Personalizadas",
    // stopwatch "de Culto" vs "Cronômetro", etc).
    $appdata.set(`modules.${btn.module}.last_btn`, btn.id);
    $modules.open(btn.module);
    return;
  }
  if (btn.action && btn.action in LITURGY_ACTIONS) {
    Broadcast.send(BROADCAST_TYPE.LITURGY_RIBBON_ACTION, {
      action: LITURGY_ACTIONS[btn.action],
    });
    return;
  }
  if (btn.action && btn.action in BIBLE_ACTIONS) {
    Broadcast.send(BROADCAST_TYPE.BIBLE_RIBBON_ACTION, {
      action: BIBLE_ACTIONS[btn.action],
    });
    return;
  }
  if (btn.action && EDITOR_ACTIONS.has(btn.action)) {
    Broadcast.send(BROADCAST_TYPE.MODULE_RIBBON_ACTION, {
      module: "slide_editor",
      action: btn.action.replace(/^editor_/, ""),
    });
    return;
  }
  // Pattern genérico: action "<module>_<verb>" → MODULE_RIBBON_ACTION
  // Suporta os módulos novos (counter, draw, name_draw, clock, stopwatch,
  // message_board) sem precisar de tabela explícita.
  if (btn.action) {
    const m = btn.action.match(
      /^(counter|draw|name_draw|clock|stopwatch|timer|message_board)_(.+)$/
    );
    if (m) {
      Broadcast.send(BROADCAST_TYPE.MODULE_RIBBON_ACTION, {
        module: m[1],
        action: m[2],
      });
      return;
    }
  }
}

function onOpenCommandPalette() {
  shell.openCommandPalette();
}
function onOpenHotkeys() {
  shell.openHotkeysCheatsheet();
}

function onOpenAbout() {
  $alert.info({
    title: t("shell.appmenu_items.about"),
    text: "LouvorJA",
    translate: false,
  });
}

function toggleTheme() {
  try {
    const cur = theme.global.name.value || "darkblue";
    const lastLight = $userdata.get("theme_last_light", null);
    const next =
      cur === "dark"
        ? lastLight && lastLight !== "dark"
          ? lastLight
          : "darkblue"
        : ($userdata.set("theme_last_light", cur), "dark");
    theme.change(next);
    $userdata.set("theme", next);
    document.documentElement.dataset.theme = next;
    $appdata.set("is_dark", next === "dark");
  } catch (err) {
    console.error("[RibbonBar] toggleTheme falhou:", err);
  }
}
</script>

<style scoped>
.ribbon {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
  font-family: var(--lj-font-shell);
}

/* ============ Linha de tabs ============ */
.ribbon-tabs-row {
  display: flex;
  align-items: stretch;
  height: var(--lj-tab-height);
  background: var(--lj-tabs-bg);
  position: relative;
  z-index: 2;
}

.ribbon-app-menu {
  height: 100%;
}

.ribbon-tabs {
  display: flex;
  align-items: stretch;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}
.ribbon-tabs::-webkit-scrollbar {
  display: none;
}

.ribbon-tab {
  display: flex;
  align-items: center;
  border: none;
  background: transparent;
  padding: 0 var(--lj-space-6);
  height: 100%;
  font-size: var(--lj-text-md);
  font-weight: var(--lj-weight-medium);
  cursor: pointer;
  color: var(--lj-tabs-color);
  transition:
    background var(--lj-transition-fast),
    color var(--lj-transition-fast);
  outline: none;
  user-select: none;
  white-space: nowrap;
  position: relative;
  font-family: inherit;
}

.ribbon-tab:hover:not(.ribbon-tab--active) {
  background: var(--lj-tabs-hover-bg);
  color: var(--lj-tabs-color-hover);
}

.ribbon-tab--active {
  background: var(--lj-tabs-active-bg);
  color: var(--lj-tabs-active-color);
  font-weight: var(--lj-weight-semibold);
}

/* Tabs contextuais (laranja sólido — replica skin officetab Delphi) */
.ribbon-tab--ctx {
  background: var(--lj-tabs-ctx-bg);
  color: var(--lj-tabs-ctx-color);
  font-weight: var(--lj-weight-semibold);
}

.ribbon-tab--ctx:hover:not(.ribbon-tab--active) {
  background: var(--lj-tabs-ctx-hover-bg);
}

/* Quando ATIVA, vira branca (igual tabs normais ativas) com indicador laranja no topo */
.ribbon-tab--ctx.ribbon-tab--ctx-active {
  background: var(--lj-tabs-active-bg);
  color: var(--lj-orange-darker);
  font-weight: var(--lj-weight-bold);
}

.ribbon-tab--ctx-active::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: var(--lj-orange);
}

/* ============ Toolbar fixa direita ============ */
.ribbon-tools {
  display: flex;
  align-items: stretch;
  padding-right: var(--lj-space-2);
}

.ribbon-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--lj-fixed-btn-width);
  height: 100%;
  padding: 0 var(--lj-space-3);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--lj-tabs-color);
  outline: none;
  font-family: inherit;
  font-size: var(--lj-text-base);
  transition:
    background var(--lj-transition-fast),
    color var(--lj-transition-fast);
}

.ribbon-tool:hover {
  background: var(--lj-tabs-hover-bg);
  color: var(--lj-tabs-color-hover);
}

.ribbon-tool--text {
  gap: var(--lj-space-2);
  padding: 0 var(--lj-space-4);
}

/* ============ Body ============ */
.ribbon-body {
  display: flex;
  align-items: stretch;
  height: var(--lj-ribbon-body-height);
  background: var(--lj-body-bg);
  border-bottom: 1px solid var(--lj-body-border);
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  z-index: 1;
  padding-left: var(--lj-space-3);
  transition: background var(--lj-transition-normal);
}

.ribbon-body--ctx {
  background: var(--lj-body-bg-ctx);
}

.ribbon-body::-webkit-scrollbar {
  height: 4px;
}

.ribbon-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lj-text-muted);
  font-size: var(--lj-text-base);
}
</style>
