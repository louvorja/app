<template>
  <div class="lit-row">
    <!-- CATEGORIA -->
    <div
      v-if="element.tipo === 'categoria'"
      class="lit-category"
      :style="{ background: element.cor || defaultColor }"
      @click="!locked && $emit('edit', index)"
    >
      <button
        v-if="!locked"
        class="lit-card-grip lit-card-grip--cat"
        :title="t('actions.drag')"
        @click.stop
      >
        <v-icon icon="mdi-drag-vertical" size="16" />
      </button>
      <span class="lit-category-text">
        {{ element.item || t("placeholders.category") }}
      </span>
      <button
        v-if="!locked"
        class="lit-card-action"
        :title="t('actions.edit')"
        @click.stop="$emit('edit', index)"
      >
        <v-icon icon="mdi-pencil" size="14" />
      </button>
    </div>

    <!-- ITEM NORMAL -->
    <div
      v-else
      class="lit-card"
      :class="{
        'lit-card--checked': isChecked(element),
        'lit-card--locked': locked,
      }"
    >
      <!-- Ícone grande do tipo -->
      <button
        class="lit-card-icon"
        :style="{ background: element.cor || defaultColor }"
        :title="locked ? '' : t('actions.change_color')"
        @click.stop="!locked && $emit('change-color', index)"
      >
        <v-icon :icon="iconFor(element)" size="28" color="white" />
      </button>

      <!-- Checkbox grande à esquerda do título -->
      <label
        class="lit-card-check lit-card-check--lead"
        :title="t('actions.mark_done')"
        @click.stop
      >
        <input
          type="checkbox"
          :checked="isChecked(element)"
          @change="$emit('toggle-checked', element)"
        />
        <span class="lit-check-mark"><v-icon icon="mdi-check" size="14" /></span>
      </label>

      <!-- Texto -->
      <button class="lit-card-text" @click="$emit('execute', element)">
        <div class="lit-card-title">{{ element.item || t("placeholders.untitled") }}</div>
        <div v-if="subtitleFor(element)" class="lit-card-subtitle">
          {{ subtitleFor(element) }}
        </div>
      </button>

      <!-- Ações específicas de música -->
      <div v-if="element.tipo === 'musica'" class="lit-card-music-actions">
        <v-tooltip location="top" :open-delay="700">
          <template #activator="{ props }">
            <button
              v-bind="props"
              class="lit-music-btn"
              @click.stop="$emit('play-music', element, 'sung')"
            >
              <v-icon icon="mdi-filmstrip" size="18" color="#c0392b" />
            </button>
          </template>

          {{ t("music.play_lyric") }}
        </v-tooltip>

        <v-tooltip
          v-if="element.has_instrumental_music || element.subtipo === 'ja'"
          location="top"
          :open-delay="700"
        >
          <template #activator="{ props }">
            <button
              v-bind="props"
              class="lit-music-btn"
              @click.stop="$emit('play-music', element, 'pb')"
            >
              <v-icon icon="mdi-filmstrip-box" size="18" color="#1b4f8a" />
            </button>
          </template>

          {{ t("music.play_lyric_pb") }}
        </v-tooltip>

        <v-tooltip location="top" :open-delay="700">
          <template #activator="{ props }">
            <button
              v-bind="props"
              class="lit-music-btn"
              @click.stop="$emit('play-music', element, 'no_audio')"
            >
              <v-icon icon="mdi-music-note-off" size="18" color="#7f8c8d" />
            </button>
          </template>

          {{ t("music.no_audio") }}
        </v-tooltip>

        <v-tooltip location="top" :open-delay="700">
          <template #activator="{ props }">
            <button
              v-bind="props"
              class="lit-music-btn"
              @click.stop="$emit('open-lyric', element.musica, 'lyric')"
            >
              <v-icon icon="mdi-text-box-outline" size="18" color="#27ae60" />
            </button>
          </template>

          {{ t("music.show_lyric") }}
        </v-tooltip>
      </div>

      <!-- Ações: editar + reordenar (sem X — exclusão pelo ribbon "Apagar Selecionados") -->
      <div class="lit-card-end">
        <v-tooltip v-if="!locked" location="top" :open-delay="500">
          <template #activator="{ props }">
            <button v-bind="props" class="lit-card-action" @click.stop="$emit('edit', index)">
              <v-icon icon="mdi-pencil" size="16" />
            </button>
          </template>

          {{ t("actions.edit") }}
        </v-tooltip>

        <v-tooltip v-if="!locked" location="top" :open-delay="500">
          <template #activator="{ props }">
            <button v-bind="props" class="lit-card-action" @click.stop="$emit('clone', index)">
              <v-icon icon="mdi-content-copy" size="16" />
            </button>
          </template>

          {{ t("actions.clone") }}
        </v-tooltip>

        <v-tooltip v-if="!locked" location="top" :open-delay="500">
          <template #activator="{ props }">
            <button
              v-bind="props"
              class="lit-card-action"
              @click.stop="$emit('confirm-remove', index)"
            >
              <v-icon icon="mdi-delete" color="red" size="16" />
            </button>
          </template>

          {{ t("actions.delete") }}
        </v-tooltip>

        <v-tooltip v-if="!locked" location="top" :open-delay="500">
          <template #activator="{ props }">
            <button v-bind="props" class="lit-card-grip" @click.stop>
              <v-icon icon="mdi-arrow-up-down" size="16" />
            </button>
          </template>

          {{ t("actions.drag") }}
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import type { LiturgyItemData } from "../types";

const TRANSLATIONS: Record<string, Record<string, unknown>> = { pt, es };

function _t(key: string, locale: string): string {
  const dict = TRANSLATIONS[locale] ?? TRANSLATIONS.pt;
  const path = key.split(".");
  let cur: unknown = dict;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in cur) cur = (cur as Record<string, unknown>)[k];
    else return key;
  }
  return typeof cur === "string" ? cur : key;
}

withDefaults(
  defineProps<{
    element: LiturgyItemData;
    index: number;
    locked?: boolean;
    defaultColor?: string;
    isChecked: (item: LiturgyItemData) => boolean;
    iconFor: (item: LiturgyItemData) => string;
    subtitleFor: (item: LiturgyItemData) => string;
  }>(),
  { locked: false, defaultColor: "#00004F" }
);

defineEmits<{
  edit: [index: number];
  clone: [index: number];
  "confirm-remove": [index: number];
  execute: [item: LiturgyItemData];
  "play-music": [item: LiturgyItemData, mode: string];
  "open-lyric": [item: LiturgyItemData, mode: string];
  "change-color": [index: number];
  "toggle-checked": [element: LiturgyItemData];
}>();

const { locale } = useI18n();
const t = (key: string) => _t(key, locale.value);
</script>

<style scoped>
.lit-row {
  display: contents;
}

/* ====================== Card item normal ====================== */
.lit-card {
  display: flex;
  align-items: stretch;
  background: var(--lj-surface-bg);
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 4px;
  height: 64px;
  transition:
    background 0.15s,
    border-color 0.15s;
  overflow: hidden;
  position: relative;
}
.lit-card:hover {
  border-color: rgba(var(--lj-navy-ch), 0.5);
  background: rgba(var(--lj-navy-ch), 0.03);
}
.lit-card--checked {
  background: rgba(78, 213, 255, 0.06);
  border-color: rgba(78, 213, 255, 0.4);
}
.lit-card--ghost {
  opacity: 0.4;
  background: rgba(var(--lj-navy-ch), 0.1);
}
.lit-card--locked {
  border-left: 3px solid rgba(var(--lj-navy-ch), 0.3);
}

.lit-card-icon {
  width: 64px;
  flex-shrink: 0;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.15s;
}
.lit-card-icon:hover {
  filter: brightness(1.15);
}

.lit-card-check--lead {
  flex-shrink: 0;
  width: 40px;
  border-right: 1px solid rgba(var(--v-border-color), 0.2);
}

.lit-card-text {
  flex: 1;
  text-align: left;
  background: transparent;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}
.lit-card-title {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lit-card--checked .lit-card-title {
  text-decoration: line-through;
  opacity: 0.6;
}
.lit-card-subtitle {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.lit-card--checked .lit-card-subtitle {
  text-decoration: line-through;
}

.lit-card-music-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 0 6px;
  border-left: 1px solid rgba(var(--v-border-color), 0.25);
}
.lit-music-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 3px;
  cursor: pointer;
  color: rgba(var(--lj-on-surface-ch), 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.lit-music-btn:hover {
  background: rgba(var(--lj-navy-ch), 0.12);
}

.lit-card-end {
  display: flex;
  align-items: center;
  border-left: 1px solid rgba(var(--v-border-color), 0.25);
  padding: 0 4px;
  gap: 2px;
}

.lit-card-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  position: relative;
}
.lit-card-check--lead {
  width: 40px;
  height: 100%;
}
.lit-card-check input {
  position: absolute;
  opacity: 0;
  inset: 0;
  cursor: pointer;
}
.lit-check-mark {
  width: 22px;
  height: 22px;
  /* Borda do checkbox vazio precisa ser claramente visível em ambos os
     temas. `rgba(var(--lj-on-surface-ch), 0.4)` ficava quase invisível
     em fundo claro — sintoma: usuário desmarcava e o quadrado "sumia". */
  border: 1.5px solid rgba(var(--v-border-color), 0.55);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  background: transparent;
}
.lit-card-check--lead .lit-check-mark {
  width: 24px;
  height: 24px;
}
.lit-card-check input:checked ~ .lit-check-mark {
  border-color: var(--lj-navy);
  background: var(--lj-navy);
  color: white;
}

.lit-card-grip,
.lit-card-action {
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 3px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  padding: 0;
}
.lit-card-grip {
  cursor: grab;
}
.lit-card-grip:active {
  cursor: grabbing;
}
.lit-card-action:hover {
  background: rgba(var(--lj-on-surface-ch), 0.08);
  color: var(--lj-text);
}
.lit-card-grip:hover {
  background: rgba(var(--lj-on-surface-ch), 0.08);
  color: var(--lj-text);
}
.lit-card-grip--cat {
  height: 100%;
  width: 28px;
  color: rgba(255, 255, 255, 0.7);
}
.lit-card-grip--cat:hover {
  color: white;
  background: rgba(0, 0, 0, 0.15);
}

.lit-category {
  display: flex;
  align-items: center;
  height: 36px;
  margin-top: 12px;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.02em;
  padding-right: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: var(--lj-shadow-1);
}
.lit-category:hover {
  filter: brightness(1.1);
}
.lit-category-text {
  flex: 1;
  text-align: center;
  text-transform: uppercase;
}
.lit-category .lit-card-action {
  color: rgba(255, 255, 255, 0.85);
}
.lit-category .lit-card-action:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>
