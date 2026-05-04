<template>
  <v-dialog
    :model-value="modelValue"
    max-width="780"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @keydown.escape="$emit('update:modelValue', false)"
  >
    <v-card class="lit-dialog">
      <div class="lit-dialog-title">
        <v-icon icon="mdi-calendar-multiselect" size="18" />
        <span>{{ t("schedules.title") }}</span>
        <v-spacer />
        <button class="lit-card-action" @click="$emit('update:modelValue', false)">
          <v-icon icon="mdi-close" size="14" />
        </button>
      </div>

      <div class="lit-schedules">
        <aside class="lit-schedules-left">
          <div class="lit-schedules-head">
            <span>{{ t("schedules.categories") }}</span>
            <button
              class="lit-card-action"
              :title="t('schedules.add_category')"
              @click="addCategory"
            >
              <v-icon icon="mdi-plus" size="14" />
            </button>
          </div>
          <ul class="lit-schedules-cats">
            <li v-if="scheduledCategories.length === 0" class="lit-hint pa-2">
              {{ t("schedules.no_categories") }}
            </li>
            <li
              v-for="c in scheduledCategories"
              :key="c.id"
              :class="['lit-schedules-cat', { 'is-active': activeCatId === c.id }]"
              @click="setActiveCatId(c.id)"
            >
              <input
                v-if="editingCatId === c.id"
                v-model="editingCatName"
                class="lit-input"
                @blur="doSaveCatName(c.id)"
                @keyup.enter="doSaveCatName(c.id)"
                @keyup.esc="editingCatId = null"
              />
              <span v-else @dblclick="startEditingCategory(c)">{{ c.nome }}</span>
              <v-spacer />
              <button
                class="lit-card-action"
                :title="t('actions.edit')"
                @click.stop="startEditingCategory(c)"
              >
                <v-icon icon="mdi-pencil" size="12" />
              </button>
              <button
                class="lit-card-action"
                :title="t('actions.remove')"
                @click.stop="removeCategory(c.id)"
              >
                <v-icon icon="mdi-close" size="12" />
              </button>
            </li>
          </ul>
        </aside>

        <section class="lit-schedules-right">
          <div class="lit-schedules-head">
            <span v-if="activeCategory">{{ activeCategory.nome }}</span>
            <span v-else>{{ t("schedules.select_category") }}</span>
            <v-spacer />
            <button
              v-if="activeCategory"
              class="lit-btn lit-btn--primary"
              @click="addScheduledItem"
            >
              <v-icon icon="mdi-plus" size="14" />
              <span>{{ t("schedules.add_item") }}</span>
            </button>
          </div>

          <div v-if="!activeCategory" class="lit-empty">
            {{ t("schedules.select_category_hint") }}
          </div>

          <div v-else class="lit-schedules-table">
            <div class="lit-schedules-row lit-schedules-row--head">
              <div class="col-date">{{ t("schedules.date") }}</div>
              <div class="col-name">{{ t("schedules.item_name") }}</div>
              <div class="col-file">{{ t("schedules.file") }}</div>
              <div class="col-actions"></div>
            </div>
            <div v-if="categoryItems.length === 0" class="lit-empty">
              {{ t("schedules.no_items") }}
            </div>
            <div v-for="it in categoryItems" :key="it.id" class="lit-schedules-row">
              <div class="col-date">
                <input
                  v-model="it.data"
                  type="date"
                  class="lit-input"
                  @change="updateScheduled(it)"
                />
              </div>
              <div class="col-name">
                <input
                  v-model="it.nome"
                  type="text"
                  class="lit-input"
                  @change="updateScheduled(it)"
                />
              </div>
              <div class="col-file">
                <input
                  v-model="it.arquivo"
                  type="text"
                  class="lit-input"
                  @change="updateScheduled(it)"
                />
              </div>
              <div class="col-actions">
                <button
                  class="lit-card-action"
                  :title="t('actions.remove')"
                  @click="removeScheduled(it.id)"
                >
                  <v-icon icon="mdi-close" size="12" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="lit-dialog-footer">
        <v-spacer />
        <button class="lit-btn lit-btn--primary" @click="$emit('update:modelValue', false)">
          {{ t("actions.close") }}
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from "vue";
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

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  scheduledCategories: { type: Array, default: () => [] },
  activeCatId: { type: [String, Number], default: null },
  activeCategory: { type: Object, default: null },
  categoryItems: { type: Array, default: () => [] },
  setActiveCatId: { type: Function, required: true },
  addCategory: { type: Function, required: true },
  saveCategoryName: { type: Function, required: true },
  removeCategory: { type: Function, required: true },
  addScheduledItem: { type: Function, required: true },
  updateScheduled: { type: Function, required: true },
  removeScheduled: { type: Function, required: true },
});

defineEmits(["update:modelValue"]);

const { locale } = useI18n();
const t = (key) => _t(key, locale.value);

const editingCatId = ref(null);
const editingCatName = ref("");

function startEditingCategory(c) {
  editingCatId.value = c.id;
  editingCatName.value = c.nome;
}

function doSaveCatName(id) {
  props.saveCategoryName(id, editingCatName.value);
  editingCatId.value = null;
}
</script>

<style scoped>
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
.lit-dialog-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid rgba(var(--v-border-color), 0.2);
  background: rgba(var(--lj-on-surface-ch), 0.02);
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
  color: rgba(var(--lj-on-surface-ch), 0.5);
  flex-shrink: 0;
}
.lit-card-action:hover {
  background: rgba(var(--lj-on-surface-ch), 0.1);
  color: var(--lj-text);
}

.lit-schedules {
  display: flex;
  min-height: 400px;
  max-height: 60vh;
}
.lit-schedules-left {
  width: 240px;
  border-right: 1px solid rgba(var(--v-border-color), 0.3);
  display: flex;
  flex-direction: column;
}
.lit-schedules-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.lit-schedules-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(var(--lj-on-surface-ch), 0.04);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  font-weight: 500;
  font-size: 12px;
}
.lit-schedules-cats {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}
.lit-schedules-cat {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
  font-size: 12px;
}
.lit-schedules-cat:hover {
  background: rgba(var(--lj-on-surface-ch), 0.04);
}
.lit-schedules-cat.is-active {
  background: rgba(var(--lj-navy-ch), 0.1);
  color: var(--lj-navy);
  font-weight: 500;
}
.lit-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--lj-on-surface-ch), 0.5);
  font-size: 12px;
  padding: 20px;
  text-align: center;
}
.lit-schedules-table {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.lit-schedules-row {
  display: grid;
  grid-template-columns: 130px 1fr 1fr 30px;
  gap: 4px;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
  align-items: center;
}
.lit-schedules-row--head {
  background: rgba(var(--lj-on-surface-ch), 0.04);
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  color: rgba(var(--lj-on-surface-ch), 0.7);
}
.lit-schedules-row .lit-input {
  height: 26px;
  font-size: 12px;
}
.lit-input {
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
.lit-input:focus {
  border-color: var(--lj-navy);
  box-shadow: 0 0 0 2px rgba(var(--lj-navy-ch), 0.15);
}
.lit-hint {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  padding: 4px 0;
}

/* Botões duplicados localmente */
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
.lit-btn--primary {
  background: var(--lj-navy);
  color: var(--lj-white);
}
.lit-btn--primary:hover {
  filter: brightness(1.1);
}

.pa-2 {
  padding: 8px;
}
</style>
