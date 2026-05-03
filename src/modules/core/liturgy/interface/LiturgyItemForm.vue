<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="lit-dialog">
      <div class="lit-dialog-title">
        <v-icon :icon="editIndex >= 0 ? 'mdi-pencil' : 'mdi-plus'" size="18" />
        <span>{{ editIndex >= 0 ? t("dialog.edit_title") : t("dialog.add_title") }}</span>
        <v-spacer />
        <button class="lit-card-action" @click="$emit('update:modelValue', false)">
          <v-icon icon="mdi-close" size="14" />
        </button>
      </div>

      <div class="lit-dialog-header">
        <div class="lit-field">
          <label>{{ t("inputs.type") }}</label>
          <select
            :value="form.tipo"
            class="lit-select"
            @change="
              setFormField('tipo', $event.target.value);
              onTypeChange();
            "
          >
            <option value="anotacao">{{ t("types.anotacao") }}</option>
            <option value="arquivo">{{ t("types.arquivo") }}</option>
            <option value="categoria">{{ t("types.categoria") }}</option>
            <option value="itensagendados">{{ t("types.itensagendados") }}</option>
            <option value="musica">{{ t("types.musica") }}</option>
            <option value="site">{{ t("types.site") }}</option>
          </select>
        </div>

        <div v-if="form.tipo !== 'itensagendados'" class="lit-field lit-field--grow">
          <label>{{ t("inputs.item_name") }}</label>
          <input
            :value="form.item"
            type="text"
            class="lit-input"
            :placeholder="t('inputs.item_name_placeholder')"
            @input="setFormField('item', $event.target.value)"
          />
        </div>

        <div class="lit-field">
          <label>{{ t("inputs.duration_min") }}</label>
          <input
            :value="form.duration"
            type="number"
            min="0"
            class="lit-input lit-input--small"
            @input="setFormField('duration', +$event.target.value)"
          />
        </div>

        <div class="lit-field lit-field--color">
          <label>{{ t("inputs.color") }}</label>
          <div class="lit-color-picker">
            <input
              :value="form.cor"
              type="color"
              class="lit-color-input"
              @input="setFormField('cor', $event.target.value)"
            />
            <div class="lit-color-presets">
              <span
                v-for="c in colors"
                :key="c"
                class="lit-color-preset"
                :class="{ 'is-active': form.cor?.toLowerCase() === c.toLowerCase() }"
                :style="{ background: c }"
                @click="setFormField('cor', c)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Painel ANOTAÇÃO -->
      <div v-if="form.tipo === 'anotacao'" class="lit-panel">
        <div class="lit-panel-title">{{ t("types.anotacao") }}</div>
        <div class="lit-field">
          <label>{{ t("inputs.annotation") }}</label>
          <textarea
            :value="form.subitem"
            rows="4"
            class="lit-input"
            :placeholder="t('inputs.annotation_placeholder')"
            @input="setFormField('subitem', $event.target.value)"
          />
        </div>
      </div>

      <!-- Painel SITE -->
      <div v-if="form.tipo === 'site'" class="lit-panel">
        <div class="lit-panel-title">{{ t("types.site") }}</div>
        <div class="lit-field">
          <label>{{ t("inputs.url") }}</label>
          <div class="lit-input-row">
            <input
              :value="form.url"
              type="text"
              class="lit-input"
              placeholder="https://"
              @input="setFormField('url', $event.target.value)"
              @blur="setFormField('url', $liturgy.validateUrl(form.url))"
            />
            <button class="lit-btn lit-btn--ghost" :title="t('actions.open')" @click="openSite">
              <v-icon icon="mdi-open-in-new" size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Painel ARQUIVO -->
      <div v-if="form.tipo === 'arquivo'" class="lit-panel">
        <div class="lit-panel-title">{{ t("types.arquivo") }}</div>
        <div class="lit-field">
          <label>{{ t("inputs.file_path") }}</label>
          <div class="lit-input-row">
            <input
              :value="form.dir"
              type="text"
              class="lit-input"
              :placeholder="t('inputs.file_path_placeholder')"
              @input="setFormField('dir', $event.target.value)"
            />
            <button
              class="lit-btn lit-btn--ghost"
              :title="t('actions.choose_folder')"
              @click="chooseFolder"
            >
              <v-icon icon="mdi-folder-outline" size="14" />
            </button>
            <button
              class="lit-btn lit-btn--ghost"
              :title="t('actions.choose_file')"
              @click="chooseFile"
            >
              <v-icon icon="mdi-file-outline" size="14" />
            </button>
          </div>
        </div>
        <div class="lit-field-row">
          <label class="lit-radio">
            <input
              type="radio"
              :checked="form.dir_info === 'E'"
              @change="setFormField('dir_info', 'E')"
            />
            {{ t("inputs.path_external") }}
          </label>
          <label class="lit-radio">
            <input
              type="radio"
              :checked="form.dir_info === 'I'"
              @change="setFormField('dir_info', 'I')"
            />
            {{ t("inputs.path_internal") }}
          </label>
        </div>
      </div>

      <!-- Painel MÚSICA -->
      <div v-if="form.tipo === 'musica'" class="lit-panel">
        <div class="lit-panel-title">{{ t("types.musica") }}</div>
        <label class="lit-radio">
          <input type="radio" :checked="form.escolha === '1'" @change="setMusicChoice(true)" />
          {{ t("inputs.music_choose_later") }}
        </label>
        <div v-if="form.escolha !== '1'" class="lit-field mt-2">
          <label>{{ t("inputs.music_select") }}</label>
          <div class="lit-input-row">
            <select
              :value="form.musica"
              class="lit-select lit-select--full"
              @change="
                setFormField('musica', +$event.target.value);
                onMusicChange();
              "
            >
              <option value="-1">{{ t("inputs.music_pick") }}</option>
              <option v-for="m in musicsList" :key="m.id_music" :value="m.id_music">
                {{ m.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Painel ITENS AGENDADOS -->
      <div v-if="form.tipo === 'itensagendados'" class="lit-panel">
        <div class="lit-panel-title">{{ t("types.itensagendados") }}</div>
        <div class="lit-field">
          <label>{{ t("inputs.scheduled_category") }}</label>
          <div class="lit-input-row">
            <select
              :value="form.id"
              class="lit-select lit-select--full"
              @change="
                setFormField('id', $event.target.value);
                onScheduledCategoryChange();
              "
            >
              <option value="">{{ t("inputs.scheduled_pick") }}</option>
              <option v-for="c in scheduledCategories" :key="c.id" :value="c.id">
                {{ c.nome }}
              </option>
            </select>
            <button
              class="lit-btn lit-btn--ghost"
              :title="t('actions.scheduled_manage')"
              @click="openSchedulesDialog"
            >
              <v-icon icon="mdi-cog-outline" size="14" />
            </button>
          </div>
        </div>
        <div v-if="scheduledCategories.length === 0" class="lit-hint">
          {{ t("inputs.scheduled_empty") }}
        </div>
      </div>

      <!-- CATEGORIA -->
      <div v-if="form.tipo === 'categoria'" class="lit-panel">
        <div class="lit-panel-title">{{ t("types.categoria") }}</div>
        <div class="lit-hint">{{ t("inputs.category_hint") }}</div>
      </div>

      <div class="lit-dialog-footer">
        <button
          v-if="editIndex >= 0"
          class="lit-btn lit-btn--danger"
          @click="confirmRemove(editIndex, true)"
        >
          <v-icon icon="mdi-delete" size="14" />
          <span>{{ t("actions.remove") }}</span>
        </button>
        <v-spacer />
        <button class="lit-btn lit-btn--ghost" @click="$emit('update:modelValue', false)">
          {{ t("actions.cancel") }}
        </button>
        <button class="lit-btn lit-btn--primary" @click="saveItem">
          <v-icon :icon="editIndex >= 0 ? 'mdi-content-save' : 'mdi-plus'" size="14" />
          <span>{{ editIndex >= 0 ? t("actions.save") : t("actions.add") }}</span>
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
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

export default {
  name: "LiturgyItemForm",
  props: {
    modelValue: { type: Boolean, default: false },
    editIndex: { type: Number, default: -1 },
    form: { type: Object, required: true },
    colors: { type: Array, default: () => [] },
    musicsList: { type: Array, default: () => [] },
    scheduledCategories: { type: Array, default: () => [] },
    setFormField: { type: Function, required: true },
    onTypeChange: { type: Function, required: true },
    onMusicChange: { type: Function, required: true },
    onScheduledCategoryChange: { type: Function, required: true },
    setMusicChoice: { type: Function, required: true },
    saveItem: { type: Function, required: true },
    confirmRemove: { type: Function, required: true },
    openSite: { type: Function, required: true },
    chooseFolder: { type: Function, required: true },
    chooseFile: { type: Function, required: true },
    openSchedulesDialog: { type: Function, required: true },
  },
  emits: ["update:modelValue"],
  methods: {
    t(key) {
      return _t(key, this.$i18n?.locale || "pt");
    },
  },
};
</script>

<style scoped>
/* ====================== Dialog ====================== */
.lit-dialog {
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  border-radius: 6px;
  overflow: hidden;
}
.lit-dialog-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-weight: 500;
}
.lit-dialog-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(var(--lj-on-surface-ch), 0.02);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
}
.lit-dialog-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid rgba(var(--v-border-color), 0.2);
  background: rgba(var(--lj-on-surface-ch), 0.02);
}
.lit-panel {
  padding: 12px 14px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
}
.lit-panel-title {
  font-weight: 500;
  font-size: 12px;
  color: rgba(var(--lj-on-surface-ch), 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

/* ====================== Fields ====================== */
.lit-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 1;
}
.lit-field--grow {
  flex: 1;
  min-width: 200px;
}
.lit-field--color {
  flex-shrink: 0;
}
.lit-field-row {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-top: 8px;
}
.lit-field label {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.7);
  font-weight: 500;
}
.lit-input,
.lit-select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 13px;
  font-family: inherit;
  width: 100%;
  outline: none;
}
.lit-input--small {
  width: 70px;
}
.lit-input:focus,
.lit-select:focus {
  border-color: var(--lj-navy);
  box-shadow: 0 0 0 2px rgba(var(--lj-navy-ch), 0.15);
}
textarea.lit-input {
  height: auto;
  padding: 6px 8px;
  resize: vertical;
}
.lit-input-row {
  display: flex;
  gap: 4px;
  align-items: center;
}
.lit-input-row .lit-input {
  flex: 1;
}
.lit-select--full {
  width: 100%;
}
.lit-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
}
.lit-hint {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  padding: 4px 0;
}

/* ====================== Color picker ====================== */
.lit-color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lit-color-input {
  width: 40px;
  height: 30px;
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 3px;
  cursor: pointer;
  padding: 0;
  background: transparent;
}
.lit-color-presets {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 3px;
}
.lit-color-preset {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  cursor: pointer;
  border: 1.5px solid rgba(var(--v-border-color), 0.3);
}
.lit-color-preset:hover {
  transform: scale(1.15);
}
.lit-color-preset.is-active {
  border-color: white;
  box-shadow: 0 0 0 2px var(--lj-navy);
}

/* ====================== Buttons ====================== */
.lit-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(var(--lj-on-surface-ch), 0.06);
  color: var(--lj-text);
  transition:
    background 0.15s,
    border 0.15s;
  white-space: nowrap;
}
.lit-btn:hover {
  background: rgba(var(--lj-on-surface-ch), 0.12);
}
.lit-btn--ghost {
  background: transparent;
  border: 1px solid transparent;
}
.lit-btn--ghost:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
  border-color: rgba(var(--v-border-color), 0.4);
}
.lit-btn--primary {
  background: var(--lj-navy);
  color: var(--lj-white);
}
.lit-btn--primary:hover {
  filter: brightness(1.1);
}
.lit-btn--danger {
  background: #dc2626;
  color: white;
}
.lit-btn--danger:hover {
  background: #b91c1c;
}

.lit-card-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  padding: 0;
}
.lit-card-action:hover {
  background: rgba(var(--lj-on-surface-ch), 0.1);
  opacity: 1;
}

.mt-2 {
  margin-top: 8px;
}
</style>
