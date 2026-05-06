<template>
  <div class="app-menu-wrapper">
    <button
      ref="trigger"
      type="button"
      class="app-menu-btn"
      :class="{ 'app-menu-btn--open': open }"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="$t('shell.appmenu')"
      :title="$t('shell.appmenu')"
      @click="toggle"
    >
      <span class="app-menu-grid" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="app-menu-overlay" @click.self="close">
        <div class="app-menu-panel" role="menu" :aria-label="$t('shell.appmenu')">
          <header class="app-menu-header" :class="{ 'app-menu-header--mac': isMac }">
            <button
              type="button"
              class="app-menu-back"
              :title="$t('alert.close')"
              :aria-label="$t('alert.close')"
              @click="close"
            >
              <v-icon icon="mdi-arrow-left" size="20" />
            </button>
            <span class="app-menu-header-title">
              {{ activeItem?.label ? $t(activeItem.label) : $t("shell.appmenu") }}
            </span>
          </header>

          <div class="app-menu-body">
            <nav class="app-menu-sidebar">
              <button
                v-for="item in items"
                :key="item.id"
                type="button"
                class="app-menu-item"
                :class="{ 'app-menu-item--active': activeItem?.id === item.id }"
                role="menuitem"
                @click="selectItem(item)"
              >
                <span class="app-menu-item-label lj-u-truncate">{{ $t(item.label) }}</span>
              </button>
            </nav>

            <div class="app-menu-content">
              <h2 class="app-menu-content-title">
                {{ activeItem?.label ? $t(activeItem.label) : "" }}
              </h2>

              <!-- Painéis específicos por item -->
              <AppMenuOpcoes v-if="activeItem?.id === 'settings'" />
              <AppMenuSobre v-else-if="activeItem?.id === 'about'" />
              <AppMenuTransmitir v-else-if="activeItem?.id === 'transmission'" />
              <AppMenuSincronizar v-else-if="activeItem?.id === 'sync'" />
              <AppMenuAtualizacoes v-else-if="activeItem?.id === 'updates'" />

              <p v-else class="app-menu-content-placeholder">
                {{ $t("shell.appmenu_content_placeholder") }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from "vue";
import AppMenuOpcoes from "./AppMenuOpcoes.vue";
import AppMenuSobre from "./AppMenuSobre.vue";
import AppMenuTransmitir from "./AppMenuTransmitir.vue";
import AppMenuSincronizar from "./AppMenuSincronizar.vue";
import AppMenuAtualizacoes from "./AppMenuAtualizacoes.vue";
import $modules from "@/helpers/Modules";
import Platform from "@/helpers/Platform";

// Detecta macOS via Platform (Electron) ou navigator (web fallback) —
// usado para ajustar o header da AppMenu (não sobrepor traffic lights)
// e usar botão retangular em vez de circular.
const isMac = computed(() => {
  if (Platform.platform === "darwin") return true;
  if (typeof navigator !== "undefined") {
    const p = (navigator.platform || navigator.userAgent || "").toLowerCase();
    return p.includes("mac");
  }
  return false;
});

const open = ref(false);
const trigger = ref(null);
const activeItem = ref(null);

/**
 * Itens com `inline: true` são renderizados DENTRO do AppMenu
 * (em vez de fechar o menu e disparar uma ação).
 */
const items = computed(() => [
  { id: "about", label: "shell.appmenu_items.about", inline: true },
  { id: "settings", label: "shell.appmenu_items.settings", inline: true },
  { id: "transmission", label: "shell.appmenu_items.transmission", inline: true },
  {
    id: "import_export",
    label: "shell.appmenu_items.import_export",
    action: () => $modules.open("liturgy"),
  },
  { id: "sync", label: "shell.appmenu_items.sync", inline: true },
  { id: "feedback", label: "shell.appmenu_items.feedback", action: openFeedback },
  { id: "updates", label: "shell.appmenu_items.check_update", inline: true },
  {
    id: "albums",
    label: "shell.appmenu_items.albums",
    action: () => $modules.open("collections"),
  },
  { id: "donate", label: "shell.appmenu_items.donate", action: openDonation },
  { id: "exit", label: "shell.appmenu_items.exit", action: exitApp },
]);

function toggle() {
  if (open.value) close();
  else openMenu();
}

function openMenu() {
  open.value = true;
  activeItem.value = items.value.find((i) => i.id === "settings") || items.value[0];
  document.addEventListener("keydown", onKeydown);
}

function close() {
  open.value = false;
  document.removeEventListener("keydown", onKeydown);
}

function onKeydown(e) {
  if (e.key === "Escape") close();
}

function selectItem(item) {
  activeItem.value = item;
  if (item.inline) return; // Renderiza dentro do menu, não fecha
  close();
  setTimeout(() => {
    try {
      item.action?.();
    } catch (err) {
      console.error(err);
    }
  }, 0);
}

function openFeedback() {
  if (typeof window !== "undefined") {
    window.open("https://github.com/juanaleixo/louvorja/issues", "_blank", "noopener,noreferrer");
  }
}

function openDonation() {
  if (typeof window !== "undefined") {
    window.open("https://www.louvorja.com.br/doacao", "_blank", "noopener,noreferrer");
  }
}

function exitApp() {
  if (typeof window === "undefined") return;
  if (window.louvorjaApi?.window?.close) window.louvorjaApi.window.close();
  else window.close();
}

onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.app-menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Botão "9 quadrados" */
.app-menu-btn {
  width: var(--lj-appmenu-width);
  height: 100%;
  min-height: var(--lj-tab-height);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: var(--lj-tabs-bg);
  cursor: pointer;
  user-select: none;
  transition: background var(--lj-transition-fast);
  outline: none;
}

.app-menu-btn:hover {
  background: var(--lj-navy-active);
}

.app-menu-btn--open {
  background: var(--lj-navy-darker);
}

.app-menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
  width: 16px;
  height: 16px;
  pointer-events: none;
}

.app-menu-grid > span {
  background: var(--lj-white);
  border-radius: 1px;
}

/* Painel fullscreen */
.app-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--lj-black-alpha-40);
  font-family: var(--lj-font-shell);
}

.app-menu-panel {
  position: absolute;
  inset: 0;
  background: var(--lj-surface-bg);
  display: flex;
  flex-direction: column;
  color: var(--lj-text);
}

.app-menu-header {
  display: flex;
  align-items: center;
  gap: var(--lj-space-5);
  height: 56px;
  padding: 0 var(--lj-space-6);
  background: var(--lj-tabs-bg);
  color: var(--lj-white);
  flex-shrink: 0;
}

/* macOS: traffic lights ocupam ~78px do canto superior esquerdo.
   Empurra o conteúdo do header pra direita pra não sobrepor. */
.app-menu-header--mac {
  padding-left: 88px;
}

.app-menu-back {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--lj-white-alpha-10);
  color: var(--lj-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--lj-transition-fast);
  font-family: inherit;
}

/* macOS: usa retângulo arredondado (HIG style) em vez de círculo. */
.app-menu-header--mac .app-menu-back {
  width: 36px;
  height: 28px;
  border-radius: 6px;
}

.app-menu-back:hover {
  background: var(--lj-white-alpha-20);
}

.app-menu-header-title {
  font-size: var(--lj-text-xl);
  font-weight: var(--lj-weight-regular);
  letter-spacing: 0.02em;
}

.app-menu-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.app-menu-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--lj-appmenu-sidebar-bg);
  display: flex;
  flex-direction: column;
  padding: var(--lj-space-3) 0;
  overflow-y: auto;
}

.app-menu-item {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 var(--lj-space-7);
  background: transparent;
  border: none;
  color: var(--lj-appmenu-sidebar-color);
  cursor: pointer;
  text-align: left;
  font-size: var(--lj-text-base);
  font-family: inherit;
  transition:
    background var(--lj-transition-fast),
    color var(--lj-transition-fast);
  outline: none;
}

.app-menu-item:hover {
  background: var(--lj-appmenu-sidebar-hover-bg);
  color: var(--lj-white);
}

.app-menu-item.app-menu-item--active {
  background: var(--lj-appmenu-sidebar-active-bg);
  color: var(--lj-appmenu-sidebar-active-color);
}

.app-menu-content {
  flex: 1;
  padding: var(--lj-space-8) 32px;
  overflow-y: auto;
  background: var(--lj-surface-bg);
}

.app-menu-content-title {
  font-size: var(--lj-text-2xl);
  font-weight: var(--lj-weight-regular);
  margin: 0 0 var(--lj-space-6);
  color: var(--lj-text);
  letter-spacing: -0.01em;
}

.app-menu-content-placeholder {
  color: var(--lj-text-muted);
  font-size: var(--lj-text-base);
  margin: var(--lj-space-6) 0;
}

.app-menu-footer {
  border-top: 1px solid var(--lj-divider);
  padding: var(--lj-space-3) var(--lj-space-6);
  font-size: var(--lj-text-sm);
  color: var(--lj-text-muted);
  text-align: right;
  background: var(--lj-surface-bg-soft);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
</style>
