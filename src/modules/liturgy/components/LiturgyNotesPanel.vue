<template>
  <aside class="lit-notes-panel">
    <header class="lit-notes-header">
      <v-icon icon="mdi-note-edit-outline" size="14" />
      <span>{{ t("notes.title") }}</span>
      <v-spacer />
      <span class="lit-notes-day">{{ dayLabel }}</span>
    </header>

    <div
      ref="editor"
      class="lit-notes-area"
      contenteditable="true"
      :data-placeholder="t('notes.placeholder')"
      @input="onEditorInput"
      @blur="onEditorInput"
    />

    <div class="lit-notes-toolbar">
      <select
        class="lit-tb-select"
        :title="t('notes.font')"
        :value="fontName"
        @change="
          exec('fontName', ($event.target as HTMLSelectElement).value);
          fontName = ($event.target as HTMLSelectElement).value;
        "
      >
        <option v-for="f in FONTS" :key="f" :value="f">{{ f }}</option>
      </select>
      <select
        class="lit-tb-select lit-tb-select--num"
        :title="t('notes.size')"
        :value="fontSize"
        @change="changeSize(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="s in SIZES" :key="s" :value="s">{{ s }}</option>
      </select>

      <div class="lit-tb-sep" />

      <button
        class="lit-tb-btn lit-tb-btn--bold"
        :title="t('notes.bold')"
        @mousedown.prevent
        @click="exec('bold')"
      >
        N
      </button>
      <button
        class="lit-tb-btn lit-tb-btn--italic"
        :title="t('notes.italic')"
        @mousedown.prevent
        @click="exec('italic')"
      >
        I
      </button>
      <button
        class="lit-tb-btn lit-tb-btn--strike"
        :title="t('notes.strike')"
        @mousedown.prevent
        @click="exec('strikeThrough')"
      >
        S
      </button>
      <button
        class="lit-tb-btn lit-tb-btn--under"
        :title="t('notes.under')"
        @mousedown.prevent
        @click="exec('underline')"
      >
        a̲b̲c̲
      </button>

      <div class="lit-tb-sep" />

      <label class="lit-tb-color" :title="t('notes.text_color')">
        <span class="lit-tb-color-icon">A</span>
        <input
          type="color"
          :value="textColor"
          @input="
            (e) => {
              const v = (e.target as HTMLInputElement).value;
              textColor = v;
              exec('foreColor', v);
            }
          "
        />
      </label>
      <label class="lit-tb-color" :title="t('notes.bg_color')">
        <span class="lit-tb-color-icon" style="background: #ffeb3b">A</span>
        <input
          type="color"
          :value="bgColor"
          @input="
            (e) => {
              const v = (e.target as HTMLInputElement).value;
              bgColor = v;
              exec('hiliteColor', v);
            }
          "
        />
      </label>

      <div class="lit-tb-sep" />

      <button
        class="lit-tb-btn"
        :title="t('notes.align_left')"
        @mousedown.prevent
        @click="exec('justifyLeft')"
      >
        <v-icon icon="mdi-format-align-left" size="14" />
      </button>
      <button
        class="lit-tb-btn"
        :title="t('notes.align_center')"
        @mousedown.prevent
        @click="exec('justifyCenter')"
      >
        <v-icon icon="mdi-format-align-center" size="14" />
      </button>
      <button
        class="lit-tb-btn"
        :title="t('notes.align_right')"
        @mousedown.prevent
        @click="exec('justifyRight')"
      >
        <v-icon icon="mdi-format-align-right" size="14" />
      </button>

      <div class="lit-tb-sep" />

      <button
        class="lit-tb-btn"
        :title="t('notes.list_ul')"
        @mousedown.prevent
        @click="exec('insertUnorderedList')"
      >
        <v-icon icon="mdi-format-list-bulleted" size="14" />
      </button>
      <button
        class="lit-tb-btn"
        :title="t('notes.list_ol')"
        @mousedown.prevent
        @click="exec('insertOrderedList')"
      >
        <v-icon icon="mdi-format-list-numbered" size="14" />
      </button>
    </div>

    <footer class="lit-notes-footer">
      <v-icon icon="mdi-clock-outline" size="12" />
      <span>{{ t("data.total") }}: {{ totalDuration }}min</span>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import pt from "../lang/pt.json";
import es from "../lang/es.json";

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

const props = withDefaults(
  defineProps<{
    dayLabel?: string;
    noteHtml?: string;
    totalDuration?: number;
    onInput: (event: Event) => void;
  }>(),
  { dayLabel: "", noteHtml: "", totalDuration: 0 }
);

const { locale } = useI18n();
const t = (key: string) => _t(key, locale.value);

const editor = ref<HTMLElement | null>(null);

const FONTS = ["Tahoma", "Arial", "Times New Roman", "Verdana", "Georgia", "Courier New"];
const SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32];

const fontName = ref("Tahoma");
const fontSize = ref<number | string>(12);
const textColor = ref("#000000");
const bgColor = ref("#ffeb3b");

function exec(cmd: string, value?: string) {
  if (!editor.value) return;
  editor.value.focus();
  // execCommand é deprecated mas continua funcionando em Electron/Chrome para edição local.
  document.execCommand(cmd, false, value);
  emitInput();
}

function changeSize(v: string) {
  fontSize.value = v;
  // execCommand fontSize aceita 1-7. Usamos um span com CSS via styleWithCSS.
  document.execCommand("styleWithCSS", false, "true");
  document.execCommand("fontSize", false, "7");
  // Substitui font tags do execCommand por span com size em px
  const fonts = editor.value?.querySelectorAll('font[size="7"]') ?? [];
  fonts.forEach((f) => {
    const span = document.createElement("span");
    span.style.fontSize = `${v}px`;
    span.innerHTML = f.innerHTML;
    f.replaceWith(span);
  });
  emitInput();
}

function emitInput() {
  if (!editor.value) return;
  const ev = new CustomEvent("input", { bubbles: false });
  Object.defineProperty(ev, "target", {
    writable: false,
    value: { innerHTML: editor.value.innerHTML },
  });
  props.onInput(ev as unknown as Event);
}

function onEditorInput() {
  emitInput();
}

function syncFromProp() {
  if (!editor.value) return;
  // Não sobrescreve enquanto o usuário está editando — quebraria o cursor.
  if (document.activeElement === editor.value) return;
  const incoming = props.noteHtml ?? "";
  if (editor.value.innerHTML !== incoming) {
    editor.value.innerHTML = incoming;
  }
}

onMounted(() => {
  syncFromProp();
});

watch(() => props.noteHtml, syncFromProp);
</script>

<style scoped>
.lit-notes-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(var(--v-border-color), 0.3);
  background: var(--lj-surface-bg);
  min-height: 0;
}

.lit-notes-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-weight: 500;
  font-size: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  background: rgba(var(--lj-on-surface-ch), 0.04);
  flex-shrink: 0;
}
.lit-notes-day {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lit-notes-area {
  flex: 1;
  margin: 0;
  padding: 10px 12px;
  border: 0;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 13px;
  font-family: Tahoma, sans-serif;
  outline: none;
  line-height: 1.5;
  overflow-y: auto;
  min-height: 0;
}
.lit-notes-area:empty::before {
  content: attr(data-placeholder);
  color: rgba(var(--lj-on-surface-ch), 0.4);
  pointer-events: none;
}

.lit-notes-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 4px 6px;
  border-top: 1px solid rgba(var(--v-border-color), 0.2);
  background: rgba(var(--lj-on-surface-ch), 0.03);
  flex-shrink: 0;
}

.lit-tb-select {
  height: 24px;
  padding: 0 4px;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 11px;
  font-family: inherit;
  outline: none;
  cursor: pointer;
}
.lit-tb-select--num {
  width: 50px;
}

.lit-tb-sep {
  width: 1px;
  height: 16px;
  background: rgba(var(--v-border-color), 0.5);
  margin: 0 4px;
}

.lit-tb-btn {
  width: 26px;
  height: 24px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: var(--lj-text);
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.lit-tb-btn:hover {
  background: rgba(var(--lj-on-surface-ch), 0.08);
  border-color: rgba(var(--v-border-color), 0.4);
}
.lit-tb-btn--bold {
  font-weight: 700;
}
.lit-tb-btn--italic {
  font-style: italic;
}
.lit-tb-btn--strike {
  text-decoration: line-through;
}

.lit-tb-color {
  position: relative;
  width: 26px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
  overflow: hidden;
}
.lit-tb-color:hover {
  background: rgba(var(--lj-on-surface-ch), 0.08);
  border-color: rgba(var(--v-border-color), 0.4);
}
.lit-tb-color-icon {
  font-weight: 700;
  font-size: 12px;
  line-height: 1;
  pointer-events: none;
  padding: 0 2px;
}
.lit-tb-color input[type="color"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.lit-notes-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.65);
  border-top: 1px solid rgba(var(--v-border-color), 0.2);
  background: rgba(var(--lj-on-surface-ch), 0.03);
  flex-shrink: 0;
}
</style>
