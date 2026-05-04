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
      <button
        v-if="!locked"
        class="lit-card-action"
        :title="t('actions.remove')"
        @click.stop="$emit('remove', index)"
      >
        <v-icon icon="mdi-close" size="14" />
      </button>
    </div>

    <!-- ITEM NORMAL -->
    <div
      v-else
      class="lit-card"
      :class="{
        'lit-card--checked': isChecked(element),
        'lit-card--locked': locked,
        'lit-card--timer-active': timerActive,
      }"
    >
      <!-- Barra de progresso do timer no item ativo -->
      <div v-if="timerActive" class="lit-card-timer-bar" :style="{ width: timerProgress + '%' }" />

      <div v-if="!locked" class="lit-card-tools">
        <button class="lit-card-grip" :title="t('actions.drag')" @click.stop>
          <v-icon icon="mdi-drag-vertical" size="16" />
        </button>
        <button
          class="lit-card-action"
          :title="t('actions.edit')"
          @click.stop="$emit('edit', index)"
        >
          <v-icon icon="mdi-pencil" size="14" />
        </button>
      </div>

      <button
        class="lit-card-icon"
        :style="{ background: element.cor || defaultColor }"
        :title="locked ? '' : t('actions.change_color')"
        @click.stop="!locked && $emit('change-color', index)"
      >
        <v-icon :icon="iconFor(element)" size="20" color="white" />
      </button>

      <button class="lit-card-text" @click="$emit('execute', element)">
        <div class="lit-card-title">{{ element.item || t("placeholders.untitled") }}</div>
        <div v-if="subtitleFor(element)" class="lit-card-subtitle">
          {{ subtitleFor(element) }}
        </div>
      </button>

      <div v-if="element.tipo === 'musica'" class="lit-card-music-actions">
        <button
          v-if="element.has_instrumental_music || element.subtipo === 'ja'"
          class="lit-music-btn"
          :title="t('music.play_lyric_pb')"
          @click.stop="$emit('play-music', element, 'pb')"
        >
          <v-icon icon="mdi-music-note-outline" size="14" />
        </button>
        <button
          class="lit-music-btn"
          :title="t('music.play_lyric')"
          @click.stop="$emit('play-music', element, 'sung')"
        >
          <v-icon icon="mdi-music-note" size="14" />
        </button>
        <button
          class="lit-music-btn"
          :title="t('music.show_lyric')"
          @click.stop="$emit('play-music', element, 'lyric')"
        >
          <v-icon icon="mdi-text-box-outline" size="14" />
        </button>
        <button
          class="lit-music-btn"
          :title="t('music.no_audio')"
          @click.stop="$emit('play-music', element, 'no_audio')"
        >
          <v-icon icon="mdi-format-list-bulleted" size="14" />
        </button>
      </div>

      <div v-if="!locked" class="lit-card-end">
        <button
          class="lit-card-action"
          :title="t('actions.remove')"
          @click.stop="$emit('remove', index)"
        >
          <v-icon icon="mdi-close" size="14" />
        </button>
        <label class="lit-card-check" :title="t('actions.mark_done')" @click.stop>
          <input
            type="checkbox"
            :checked="isChecked(element)"
            @change="$emit('toggle-checked', element)"
          />
          <span class="lit-check-mark"><v-icon icon="mdi-check" size="14" /></span>
        </label>
      </div>

      <!-- Em modo bloqueado: só mostra checkbox -->
      <div v-else class="lit-card-end">
        <label class="lit-card-check" :title="t('actions.mark_done')" @click.stop>
          <input
            type="checkbox"
            :checked="isChecked(element)"
            @change="$emit('toggle-checked', element)"
          />
          <span class="lit-check-mark"><v-icon icon="mdi-check" size="14" /></span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import pt from "../lang/pt.json";
import es from "../lang/es.json";

const TRANSLATIONS = { pt, es };

function _t(key, locale) {
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.pt;
  const path = key.split(".");
  let cur = dict;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in cur) cur = cur[k];
    else return key;
  }
  return typeof cur === "string" ? cur : key;
}

defineProps({
  element: { type: Object, required: true },
  index: { type: Number, required: true },
  locked: { type: Boolean, default: false },
  timerActive: { type: Boolean, default: false },
  timerProgress: { type: Number, default: 0 },
  defaultColor: { type: String, default: "#00004F" },
  isChecked: { type: Function, required: true },
  iconFor: { type: Function, required: true },
  subtitleFor: { type: Function, required: true },
});

defineEmits(["edit", "remove", "execute", "play-music", "change-color", "toggle-checked"]);

const { locale } = useI18n();
const t = (key) => _t(key, locale.value);
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
  height: 56px;
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
.lit-card--timer-active {
  border-color: rgba(var(--lj-navy-ch), 0.8);
  box-shadow: 0 0 0 2px rgba(var(--lj-navy-ch), 0.2);
}
.lit-card--locked {
  border-left: 3px solid rgba(var(--lj-navy-ch), 0.3);
}

/* Barra de progresso do timer */
.lit-card-timer-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--lj-navy);
  transition: width 1s linear;
  z-index: 1;
}

.lit-card-tools {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(var(--v-border-color), 0.3);
  background: rgba(var(--lj-on-surface-ch), 0.03);
}
.lit-card-grip,
.lit-card-action {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex: 1;
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
.lit-card-grip--cat {
  height: 100%;
  width: 28px;
  color: rgba(255, 255, 255, 0.7);
}
.lit-card-grip--cat:hover {
  color: white;
}

.lit-card-icon {
  width: 56px;
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
  font-size: 13px;
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
}
.lit-card--checked .lit-card-subtitle {
  text-decoration: line-through;
}

.lit-card-music-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 0 4px;
  border-left: 1px solid rgba(var(--v-border-color), 0.3);
}
.lit-music-btn {
  width: 26px;
  height: 26px;
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
  background: rgba(var(--lj-navy-ch), 0.15);
  color: var(--lj-navy);
}

.lit-card-end {
  display: flex;
  align-items: center;
  border-left: 1px solid rgba(var(--v-border-color), 0.3);
  padding: 0 4px;
  gap: 2px;
}
.lit-card-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  cursor: pointer;
  position: relative;
}
.lit-card-check input {
  position: absolute;
  opacity: 0;
  inset: 0;
  cursor: pointer;
}
.lit-check-mark {
  width: 18px;
  height: 18px;
  border: 1.5px solid rgba(var(--lj-on-surface-ch), 0.4);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  background: transparent;
}
.lit-card-check input:checked ~ .lit-check-mark {
  border-color: var(--lj-navy);
  background: var(--lj-navy);
  color: white;
}

/* ====================== Categoria ====================== */
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
