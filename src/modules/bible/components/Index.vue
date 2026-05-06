<template>
  <ModuleContainer :manifest="manifest" compact :index="loading" @close="close()">
    <template #header>
      <div class="d-flex align-center" style="gap: 12px; flex: 1; min-width: 0">
        <l-select
          v-model="bible.id_bible_version"
          :label="t('version')"
          :items="versions_list ?? []"
          item-value="value"
          item-title="title"
        />

        <v-checkbox
          v-if="!compact"
          v-model="show_history"
          :label="t('show_history')"
          density="compact"
          hide-details
          color="primary"
          style="flex-shrink: 0"
        />
      </div>

      <!-- Os campos abaixo serão exibidos apenas no mobile / reolução pequena -->
      <div v-if="compact">
        <div class="my-2" />
        <l-select
          v-model="bible.id_bible_book"
          :label="t('book')"
          :items="books ?? []"
          item-value="id_bible_book"
          item-title="name"
          item-subtitle="abbreviation"
          icon="mdi-book-open-page-variant"
        />
        <div class="my-2" />
        <l-select
          v-model="bible.chapter"
          :label="t('chapter')"
          :items="chaptersList"
          item-value="id"
          item-title="value"
          icon="mdi-bookmark"
        />
        <div class="my-2" />
        <l-select
          v-model="bible_verses"
          :label="t('verses')"
          :items="versesList"
          item-value="id"
          item-title="value"
          multiple
          icon="mdi-format-list-numbered"
        />
      </div>
    </template>

    <div v-if="!compact" class="bible-layout">
      <!-- Coluna Formatar -->
      <div v-if="show_format" class="bible-col bible-col--format">
        <FormatPanel :module-id="moduleId" :manifest="manifest" />
      </div>

      <!-- Coluna Livros -->
      <div class="bible-col bible-col--books">
        <div class="bible-col__search">
          <l-select
            v-model="bible.id_bible_book"
            :label="t('book')"
            :items="books ?? []"
            item-value="id_bible_book"
            item-title="name"
            item-subtitle="abbreviation"
            icon="mdi-book-open-page-variant"
          />
        </div>
        <div class="bible-col__grid">
          <v-skeleton-loader
            v-for="n in 10"
            v-show="loading_book"
            :key="n"
            class="ma-1"
            :height="80"
            :width="100"
          />
          <v-card
            v-for="b in books"
            :id="`listBook_${b.id_bible_book}`"
            :key="b.id_bible_book"
            :color="b.color"
            class="ma-1 d-flex align-center flex-column"
            :height="80"
            :width="100"
            hover
            :variant="b.id_bible_book == bible.id_bible_book ? 'flat' : 'tonal'"
            @click="selBook(b.id_bible_book)"
          >
            <v-card-title class="flex-grow-1 pa-0 ma-0 text-h4 d-flex align-center">
              {{ b.abbreviation }}
            </v-card-title>
            <v-card-text
              class="flex-grow-0 pa-0 px-1 ma-0 text-caption text-truncate text-center w-100"
            >
              {{ b.name }}
            </v-card-text>
          </v-card>
        </div>
      </div>

      <!-- Coluna Capítulos -->
      <div class="bible-col bible-col--chapters">
        <div class="bible-col__search">
          <l-select
            v-model="bible.chapter"
            :label="t('chapter')"
            :items="chaptersList"
            item-value="id"
            item-title="value"
            icon="mdi-bookmark"
          />
        </div>
        <div class="bible-col__grid">
          <v-skeleton-loader
            v-for="n in 10"
            v-show="loading_book"
            :key="n"
            class="ma-1"
            :height="40"
            :width="40"
          />
          <v-card
            v-for="chapter in chapters"
            :id="`listChapter_${chapter}`"
            :key="chapter"
            :color="book?.color"
            class="ma-1 d-flex align-center flex-column"
            :height="40"
            :width="40"
            hover
            :variant="chapter == bible.chapter ? 'flat' : 'tonal'"
            @click="selChapter(chapter)"
          >
            <v-card-title
              class="flex-grow-1 pa-0 ma-0 d-flex align-center font-weight-regular"
              style="font-size: 16px"
            >
              {{ chapter }}
            </v-card-title>
          </v-card>
        </div>
      </div>

      <!-- Coluna Versículos -->
      <div class="bible-col bible-col--verses">
        <div class="bible-col__search">
          <v-text-field
            v-model="verse_filter"
            :label="t('locate')"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            prepend-inner-icon="mdi-magnify"
          />
        </div>
        <div class="bible-col__verses-list">
          <v-skeleton-loader v-show="loading_book || loading_verses" type="list-item-two-line" />
          <div v-show="!loading_book && !loading_verses" class="bible-verses-list">
            <div
              v-for="(verse, num) in filteredVerses"
              :id="`listVerse_${num}`"
              :key="num"
              :class="['bible-verse', { 'bible-verse--active': bible.verses.includes(+num) }]"
              @click="selVerse($event, num)"
            >
              <span class="bible-verse__num">{{ num }}</span>
              <span class="bible-verse__text" v-html="verse"></span>
            </div>
          </div>
        </div>
        <!-- Preview da projeção (estilo área expandida do Delphi) -->
        <div class="bible-col__preview">
          <Screen :height="160" />
        </div>
      </div>

      <!-- Coluna Histórico -->
      <div v-if="show_history" class="bible-col bible-col--history">
        <div class="bible-history-pane__title">
          {{ t("history") }}
        </div>
        <div class="bible-history-pane__list">
          <div v-if="!history.length" class="bible-history-pane__empty">
            {{ t("no_history") }}
          </div>
          <div
            v-for="(entry, idx) in history"
            :key="entry.opened_at"
            :class="[
              'bible-history-item',
              { 'bible-history-item--selected': history_selected === idx },
            ]"
            @click="history_selected = idx"
            @dblclick="loadHistoryEntry(entry)"
          >
            <div class="bible-history-item__ref">{{ entry.scriptural_reference }}</div>
            <div class="bible-history-item__text">{{ truncate(entry.text, 90) }}</div>
          </div>
        </div>
        <div class="bible-history-pane__footer">
          <v-btn
            block
            size="small"
            variant="tonal"
            :disabled="history_selected === null"
            @click="removeHistoryEntry()"
          >
            {{ t("delete_selected") }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Modo compacto (mobile): só lista de versículos -->
    <div v-else class="bible-layout bible-layout--compact">
      <div class="bible-col bible-col--verses">
        <div class="bible-col__verses-list">
          <v-skeleton-loader v-show="loading_book || loading_verses" type="list-item-two-line" />
          <div v-show="!loading_book && !loading_verses" class="bible-verses-list">
            <div
              v-for="(verse, num) in filteredVerses"
              :id="`listVerse_${num}`"
              :key="num"
              :class="['bible-verse', { 'bible-verse--active': bible.verses.includes(+num) }]"
              @click="selVerse($event, num)"
            >
              <span class="bible-verse__num">{{ num }}</span>
              <span class="bible-verse__text" v-html="verse"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <v-spacer />
      <v-divider vertical />
      <v-btn
        :disabled="!(select_bible?.verses && select_bible.verses.length > 0)"
        variant="text"
        size="small"
        :prepend-icon="'mdi-eraser'"
        @click="clean()"
      >
        {{ t("clear_text") }}
      </v-btn>
      <v-divider vertical />
      <v-btn
        :disabled="!(select_bible?.verses && select_bible.verses.length > 0)"
        variant="text"
        size="small"
        prepend-icon="mdi-chevron-left"
        @click="prevVerse()"
      >
        {{ t("prev_verse") }}
      </v-btn>
      <v-btn
        :disabled="!(select_bible?.verses && select_bible.verses.length > 0)"
        variant="text"
        size="small"
        append-icon="mdi-chevron-right"
        @click="nextVerse()"
      >
        {{ t("next_verse") }}
      </v-btn>
    </template>
  </ModuleContainer>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import Screen from "../components/Screen.vue";
import FormatPanel from "@/components/FormatPanel.vue";
import LSelect from "@/components/inputs/LjSelect.vue";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import { useBroadcastListener } from "@/composables/useBroadcastListener";
import Hotkeys from "@/helpers/Hotkeys";
import Modules from "@/helpers/Modules";
import AppData from "@/helpers/AppData";
import UserData from "@/helpers/UserData";
import Database from "@/helpers/Database";
import Broadcast from "@/helpers/Broadcast";
import { scrollToElement } from "@/helpers/Dom";

const HISTORY_MAX = 30;

const { t: i18nT, locale } = useI18n();
const { width } = useDisplay();
const moduleId = manifest.id;
const module_ = computed(() => Modules.get(moduleId));
const show = computed(() => module_.value?.show);

const loading = ref(false);
const loading_book = ref(false);
const loading_verses = ref(false);
const lang = ref(null);
const last_verse = ref(1);
const last_bible_file = ref(null);
const versions = ref([]);
const books = ref([]);
const verses = ref({});
const verse_filter = ref("");
const history_selected = ref(null);

const show_history = computed({
  get: () => UserData.get(`modules.${moduleId}.show_history`, true),
  set: (v) => UserData.set(`modules.${moduleId}.show_history`, v),
});

const show_format = computed({
  get: () => UserData.get(`modules.${moduleId}.show_format`, false),
  set: (v) => UserData.set(`modules.${moduleId}.show_format`, v),
});

const FONT_OPTIONS = [
  "Arial, sans-serif",
  "Helvetica, sans-serif",
  "Verdana, sans-serif",
  "Tahoma, sans-serif",
  "Georgia, serif",
  "Times New Roman, serif",
  "Courier New, monospace",
];

// Proxy reativo para campos de customization (lê/escreve em UserData
// e dispara broadcast para a janela de projeção atualizar em tempo real).
const fmt = new Proxy(
  {},
  {
    get(_, key) {
      return UserData.get(`modules.${moduleId}.${String(key)}`, null);
    },
    set(_, key, value) {
      UserData.set(`modules.${moduleId}.${String(key)}`, value);
      Broadcast.send(BROADCAST_TYPE.BIBLE_FORMAT_CHANGED, { key: String(key), value });
      return true;
    },
  }
);

const history = computed(() => UserData.get(`modules.${moduleId}.history`, []));

const bible = reactive({
  id_bible_version: null,
  id_bible_book: null,
  version: null,
  book: null,
  chapter: null,
  verses: [],
});

const select_bible = reactive({
  id_bible_version: null,
  id_bible_book: null,
  version: null,
  book: null,
  chapter: null,
  verses: [],
  scriptural_reference: null,
  text: null,
});

const t = (text) => i18nT(`modules.${moduleId}.${text}`);

const book = computed(() => books.value.find((b) => b.id_bible_book == bible.id_bible_book));
const version = computed(() =>
  versions.value.find((b) => b.id_bible_version == bible.id_bible_version)
);
const chapters = computed(() => book.value?.chapters);

const versions_list = computed(() =>
  versions.value.map((v) => ({
    title: v.abbreviation + " - " + v.name,
    value: v.id_bible_version,
  }))
);

const compact = computed(() => width.value <= 750);

const bible_verses = computed({
  get: () => bible.verses,
  set: (value) => {
    if (value.length === 0) {
      clean();
      return;
    }
    if (value.length === 1) {
      selVerse(null, value[0]);
    } else {
      const added = value.filter((v) => !bible.verses.includes(v));
      const removed = bible.verses.filter((v) => !value.includes(v));
      const event = { ctrlKey: true };
      if (added.length > 0) {
        selVerse(event, added[0]);
      } else if (removed.length > 0) {
        selVerse(event, removed[0]);
      }
    }
  },
});

watch(show, async (val) => {
  if (val && lang.value !== locale.value) {
    versions.value = [];
    books.value = [];
    verses.value = {};
    Object.assign(bible, {
      id_bible_version: null,
      id_bible_book: null,
      version: null,
      book: null,
      chapter: null,
      verses: [],
    });
    Object.assign(select_bible, {
      id_bible_version: null,
      id_bible_book: null,
      version: null,
      book: null,
      chapter: null,
      verses: [],
      scriptural_reference: null,
      text: null,
    });
    await loadData();
  }
});

watch(
  () => ({ ...select_bible }),
  () => {
    send("scriptural_reference", select_bible.scriptural_reference);
    send("text", select_bible.text);
  }
);

const _hotkeyPrev = () => {
  if (select_bible?.verses?.length > 0) prevVerse();
};
const _hotkeyNext = () => {
  if (select_bible?.verses?.length > 0) nextVerse();
};
const _hotkeyClean = () => {
  if (select_bible?.verses?.length > 0) clean();
};

// Atalhos só ativos quando o módulo Bíblia está visível.
// Antes registravam no onMounted e ficavam ativos mesmo com a Bíblia
// minimizada/escondida — Modules.vue mantém todo módulo aberto no DOM, então
// o componente nunca desmonta. Resultado: ArrowLeft/Right consumidas pelo
// Bible mesmo com a janela do media em foco. Agora seguem o show do módulo.
let _hotkeysRegistered = false;
function _registerBibleHotkeys() {
  if (_hotkeysRegistered) return;
  Hotkeys.register("ArrowLeft", _hotkeyPrev, {
    context: "bible",
    description: "hotkeys.bible_prev_verse",
    group: "bible",
    label: "←",
  });
  Hotkeys.register("ArrowRight", _hotkeyNext, {
    context: "bible",
    description: "hotkeys.bible_next_verse",
    group: "bible",
    label: "→",
  });
  Hotkeys.register("Delete", _hotkeyClean, {
    context: "bible",
    description: "hotkeys.bible_clear",
    group: "bible",
    label: "Del",
  });
  _hotkeysRegistered = true;
}
function _unregisterBibleHotkeys() {
  if (!_hotkeysRegistered) return;
  Hotkeys.unregister("ArrowLeft", _hotkeyPrev);
  Hotkeys.unregister("ArrowRight", _hotkeyNext);
  Hotkeys.unregister("Delete", _hotkeyClean);
  _hotkeysRegistered = false;
}

watch(
  show,
  (visible) => {
    if (visible) _registerBibleHotkeys();
    else _unregisterBibleHotkeys();
  },
  { immediate: true }
);

onMounted(async () => {
  await loadData();
});

onUnmounted(() => {
  _unregisterBibleHotkeys();
});

function send(param, value) {
  AppData.set(`modules.${moduleId}.data.${param}`, value);
}

async function loadData() {
  loading.value = true;

  if (books.value.length <= 0) {
    loading_book.value = true;
    books.value = await Database.get(`${locale.value}_bible_book`);
    if (!bible.id_bible_book) {
      await selBook(books.value[0].id_bible_book);
    }
    loading_book.value = false;
  }

  if (versions.value.length <= 0) {
    versions.value = await Database.get(`${locale.value}_bible_version`);
    if (!bible.id_bible_version) {
      await selVersion(versions.value[0].id_bible_version);
    }
  }

  const bible_file = `bible_${bible.id_bible_version}_${bible.id_bible_book}_${bible.chapter}`;
  if (bible_file !== last_bible_file.value) {
    loading_verses.value = true;
    verses.value = {};
    verses.value = await Database.get(bible_file);
    last_bible_file.value = bible_file;
    loading_verses.value = false;
  }

  if (
    select_bible.id_bible_book === bible.id_bible_book &&
    select_bible.chapter === bible.chapter &&
    select_bible.id_bible_version === bible.id_bible_version
  ) {
    bible.verses = select_bible.verses;
  }

  lang.value = locale.value;
  loading.value = false;
}

async function selVersion(id_bible_version) {
  if (id_bible_version) bible.id_bible_version = id_bible_version;
  bible.version = version.value?.abbreviation;
  bible.verses = [];
  last_verse.value = 1;
  await loadData();
}

async function selBook(id_bible_book) {
  if (id_bible_book) bible.id_bible_book = id_bible_book;
  bible.book = book.value.name;
  bible.verses = [];
  last_verse.value = 1;
  if (!bible.chapter) {
    selChapter(1);
  } else if (bible.chapter > book.value.chapters) {
    selChapter(book.value.chapters);
  } else {
    await loadData();
  }

  scrollToElement(document.getElementById(`listBook_${id_bible_book}`));
}

async function selChapter(chapter) {
  if (chapter) bible.chapter = chapter;
  bible.verses = [];
  last_verse.value = 1;
  await loadData();

  scrollToElement(document.getElementById(`listChapter_${chapter}`));
}

async function selVerse(event, num) {
  if (event) {
    try {
      event.preventDefault();
    } catch {
      /* noop */
    }
  }

  num = parseInt(num, 10);
  if (isNaN(num)) return;

  if (event?.ctrlKey) {
    const index = bible.verses.indexOf(num);
    if (index === -1) {
      bible.verses.push(num);
    } else {
      bible.verses.splice(index, 1);
    }
  } else if (event?.shiftKey) {
    const start = Math.min(num, last_verse.value);
    const end = Math.max(num, last_verse.value);
    for (let i = start; i <= end; i++) {
      if (!bible.verses.includes(i)) bible.verses.push(i);
    }
  } else {
    if (bible.verses.length === 1 && bible.verses[0] === num) {
      bible.verses.splice(0, 1);
      clean();
      return;
    }
    bible.verses = [num];
  }

  last_verse.value = num;
  bible.verses.sort((a, b) => a - b);
  Object.assign(select_bible, bible);
  select_bible.scriptural_reference = scripturalReference(select_bible);
  select_bible.text = getSelectedVerses(select_bible.verses);

  Broadcast.send(BROADCAST_TYPE.BIBLE_VERSE, {
    text: select_bible.text,
    reference: select_bible.scriptural_reference,
    active: true,
  });

  pushHistory(select_bible);
  scrollToElement(document.getElementById(`listVerse_${last_verse.value}`));
}

function pushHistory(data) {
  if (!data?.scriptural_reference || !data?.text) return;
  const entry = {
    id_bible_version: data.id_bible_version,
    id_bible_book: data.id_bible_book,
    version: data.version,
    book: data.book,
    chapter: data.chapter,
    verses: [...(data.verses || [])],
    scriptural_reference: data.scriptural_reference,
    text: data.text,
    opened_at: Date.now(),
  };
  const list = (UserData.get(`modules.${moduleId}.history`, []) || []).filter(
    (h) => h.scriptural_reference !== entry.scriptural_reference
  );
  list.unshift(entry);
  UserData.set(`modules.${moduleId}.history`, list.slice(0, HISTORY_MAX));
}

async function loadHistoryEntry(entry) {
  if (!entry) return;
  if (entry.id_bible_version && entry.id_bible_version !== bible.id_bible_version) {
    await selVersion(entry.id_bible_version);
  }
  if (entry.id_bible_book && entry.id_bible_book !== bible.id_bible_book) {
    await selBook(entry.id_bible_book);
  }
  if (entry.chapter && entry.chapter !== bible.chapter) {
    await selChapter(entry.chapter);
  }
  if (entry.verses?.length) {
    bible.verses = [];
    for (const v of entry.verses) {
      selVerse({ ctrlKey: true }, v);
    }
  }
}

function removeHistoryEntry() {
  const idx = history_selected.value;
  if (idx === null || idx === undefined) return;
  const list = [...(UserData.get(`modules.${moduleId}.history`, []) || [])];
  list.splice(idx, 1);
  UserData.set(`modules.${moduleId}.history`, list);
  history_selected.value = null;
}

function truncate(text, n) {
  if (!text) return "";
  const clean = String(text).replace(/<[^>]+>/g, "");
  return clean.length > n ? clean.slice(0, n).trim() + "…" : clean;
}

async function prevVerse() {
  if (select_bible?.id_bible_version) await selVersion(select_bible.id_bible_version);
  if (select_bible?.id_bible_book) await selBook(select_bible.id_bible_book);
  if (select_bible?.chapter) await selChapter(select_bible.chapter);
  if (select_bible?.verses && select_bible.verses.length > 0) {
    let verse = Math.min(...select_bible.verses.filter((n) => n > 0));
    if (verse > 1) {
      verse--;
    } else if (select_bible.chapter > 1) {
      await selChapter(select_bible.chapter - 1);
      verse = Math.max(0, ...Object.keys(verses.value).map(Number));
    } else {
      let bookIndex = books.value.findIndex((b) => b.id_bible_book == bible.id_bible_book);
      const bk = bookIndex > 0 ? books.value[bookIndex - 1] : books.value[books.value.length - 1];
      await selBook(bk.id_bible_book);
      await selChapter(bk.chapters);
      verse = Math.max(0, ...Object.keys(verses.value).map(Number));
    }
    selVerse(null, verse);
  }
}

async function nextVerse() {
  if (select_bible?.id_bible_version) await selVersion(select_bible.id_bible_version);
  if (select_bible?.id_bible_book) await selBook(select_bible.id_bible_book);
  if (select_bible?.chapter) await selChapter(select_bible.chapter);
  if (select_bible?.verses && select_bible.verses.length > 0) {
    let verse = Math.max(...select_bible.verses);
    const max_verse = Math.max(0, ...Object.keys(verses.value).map(Number));
    const max_chapter = book.value.chapters;
    if (verse < max_verse) {
      verse++;
    } else if (select_bible.chapter < max_chapter) {
      await selChapter(select_bible.chapter + 1);
      verse = 1;
    } else {
      let bookIndex = books.value.findIndex((b) => b.id_bible_book == bible.id_bible_book);
      const bk = bookIndex < books.value.length - 1 ? books.value[bookIndex + 1] : books.value[0];
      await selBook(bk.id_bible_book);
      await selChapter(1);
      verse = 1;
    }
    selVerse(null, verse);
  }
}

const chaptersList = computed(() => {
  if (!chapters.value) return [];
  return Array.from({ length: chapters.value }, (_, i) => ({ id: i + 1, value: i + 1 }));
});

const versesList = computed(() => {
  if (!verses.value) return [];
  return Object.keys(verses.value).map((v) => ({ id: +v, value: +v }));
});

const filteredVerses = computed(() => {
  if (!verses.value) return {};
  const term = (verse_filter.value || "").trim().toLowerCase();
  if (!term) return verses.value;
  const match = (text) =>
    String(text || "")
      .replace(/<[^>]+>/g, "")
      .toLowerCase()
      .includes(term);
  const out = {};
  for (const [num, text] of Object.entries(verses.value)) {
    if (term === String(num) || match(text)) out[num] = text;
  }
  return out;
});

function numbersInterval(numbers) {
  if (!numbers || numbers.length === 0) return "";
  numbers.sort((a, b) => a - b);
  let result = [];
  let start = numbers[0];
  let end = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] === end + 1) {
      end = numbers[i];
    } else {
      result.push(start === end ? `${start}` : `${start}-${end}`);
      start = numbers[i];
      end = numbers[i];
    }
  }
  result.push(start === end ? `${start}` : `${start}-${end}`);
  return result.join(", ");
}

function scripturalReference(data) {
  const verses_interval = numbersInterval(data.verses);
  if (!data.book || !data.version) return "";
  return (
    data.book +
    " " +
    data.chapter +
    (verses_interval ? `:${verses_interval}` : "") +
    (data.version ? ` (${data.version})` : "")
  ).trim();
}

function getSelectedVerses(keys) {
  keys.sort((a, b) => a - b);
  let result = "";
  let previousKey = null;
  keys.forEach((key) => {
    if (previousKey !== null && key - previousKey > 1) {
      result += " [...] ";
    } else if (result) {
      result += " ";
    }
    result += verses.value[key];
    previousKey = key;
  });
  return result;
}

function clean() {
  bible.verses = [];
  Object.assign(select_bible, {
    id_bible_version: null,
    id_bible_book: null,
    version: null,
    book: null,
    chapter: null,
    verses: [],
    scriptural_reference: null,
    text: null,
  });
}

function close() {
  clean();
}

function restoreFormat() {
  const customization = manifest.customization || {};
  for (const [key, def] of Object.entries(customization)) {
    UserData.set(`modules.${moduleId}.${key}`, def?.default ?? null);
  }
  Broadcast.send(BROADCAST_TYPE.BIBLE_FORMAT_CHANGED, { key: "*", value: null });
}

// Ações da ribbon contextual "Configurar Bíblia" → executa localmente.
useBroadcastListener(BROADCAST_TYPE.BIBLE_RIBBON_ACTION, (payload) => {
  if (!show.value) return; // Só responde se a Bíblia está aberta
  switch (payload?.action) {
    case "clear":
      clean();
      break;
    case "prev_verse":
      prevVerse();
      break;
    case "next_verse":
      nextVerse();
      break;
    case "toggle_format":
      show_format.value = !show_format.value;
      break;
    case "restore":
      restoreFormat();
      break;
  }
});

// Quando uma janela de projeção pede o estado, reemitir o versículo atual.
useBroadcastListener(BROADCAST_TYPE.REQUEST_BIBLE_STATE, () => {
  Broadcast.send(BROADCAST_TYPE.BIBLE_VERSE, {
    text: select_bible.text || "",
    reference: select_bible.scriptural_reference || "",
    active: !!(select_bible.text && select_bible.verses?.length),
  });
});
</script>

<style scoped>
.bible-layout {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  min-height: 0;
  gap: 1px;
  background: var(--lj-surface-border);
}

.bible-layout--compact {
  flex-direction: column;
}

.bible-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--lj-surface-bg);
  overflow: hidden;
}

.bible-col--format {
  flex: 0 0 200px;
  width: 200px;
  padding: 8px 10px;
  overflow-y: auto;
}

.bible-col--books {
  flex: 1.4 1 0;
}

.bible-col--chapters {
  flex: 0.6 1 0;
}

.bible-col--verses {
  flex: 1.5 1 0;
}

.bible-col--history {
  flex: 0 0 260px;
  width: 260px;
}

.bible-col__search {
  flex-shrink: 0;
  padding: 8px 8px 6px;
  border-bottom: 1px solid var(--lj-surface-border);
}

.bible-col__grid {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;
  padding: 4px;
  min-height: 0;
}

.bible-col__verses-list {
  flex: 1;
  overflow: auto;
  padding: 0 8px;
  min-height: 0;
}

.bible-col__preview {
  flex-shrink: 0;
  border-top: 1px solid var(--lj-surface-border);
  padding: 4px;
  background: rgba(0, 0, 0, 0.05);
}

.bible-col__group-title {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--lj-text-muted, #666);
  background: var(--lj-surface-bg-soft, #eee);
  padding: 4px 6px;
  margin: 8px -10px 6px;
  border-top: 1px solid var(--lj-surface-border);
  border-bottom: 1px solid var(--lj-surface-border);
}

.bible-col__group-title:first-child {
  margin-top: 0;
}

.bible-col__group-title--alt {
  text-transform: none;
  letter-spacing: 0;
  font-size: 12px;
  background: transparent;
  border: none;
  text-align: left;
  padding: 8px 0 4px;
  margin: 6px 0 4px;
  font-weight: 600;
  color: inherit;
}

.bible-format-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}

.bible-format-label {
  font-size: 11px;
  color: var(--lj-text-muted, #666);
}

.bible-format-input {
  font-size: 12px;
  padding: 4px 6px;
  border: 1px solid var(--lj-surface-border);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: inherit;
  width: 100%;
  box-sizing: border-box;
}

.bible-format-input--narrow {
  width: 70px;
}

.bible-format-color {
  width: 100%;
  height: 26px;
  padding: 0;
  border: 1px solid var(--lj-surface-border);
  border-radius: 3px;
  cursor: pointer;
  background: transparent;
}

.bible-verses-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 2px 12px;
}

.bible-verse {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.78);
  color: #f1f1f1;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}

.bible-verse:hover {
  background: rgba(0, 0, 0, 0.92);
}

.bible-verse--active {
  background: rgba(33, 150, 243, 0.85);
  color: #fff;
}

.bible-verse__num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
  font-family: Georgia, "Times New Roman", serif;
  margin-top: 2px;
}

.bible-verse__text {
  flex: 1;
  font-size: 13px;
  line-height: 1.45;
  word-break: break-word;
}

.bible-history-pane__title {
  padding: 10px 14px;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 1px solid var(--lj-surface-border);
  flex-shrink: 0;
}

.bible-history-pane__list {
  flex: 1;
  overflow: auto;
  background: rgba(0, 0, 0, 0.85);
  padding: 4px;
  min-height: 0;
}

.bible-history-pane__empty {
  padding: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.bible-history-item {
  padding: 8px 10px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  transition: background 0.15s ease;
}

.bible-history-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.bible-history-item--selected {
  background: rgba(33, 150, 243, 0.55);
  color: #fff;
}

.bible-history-item__ref {
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 2px;
}

.bible-history-item__text {
  font-size: 11px;
  line-height: 1.3;
  opacity: 0.78;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bible-history-pane__footer {
  padding: 8px;
  border-top: 1px solid var(--lj-surface-border);
  flex-shrink: 0;
}
</style>
