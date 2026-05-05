<template>
  <ModuleContainer :manifest="manifest" compact :index="loading" @close="close()">
    <template #header>
      <l-select
        v-model="bible.id_bible_version"
        :label="t('version')"
        :items="versions_list ?? []"
        item-value="value"
        item-title="title"
      />

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

    <template #left>
      <div v-if="!compact" class="d-flex flex-row h-100">
        <!-- Combined Book Selection Area -->
        <div class="w-70 h-100 d-flex flex-column pt-2">
          <!-- Book Search Menu (inline above book list) -->
          <div style="flex-shrink: 0" class="ps-4 pe-1">
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

          <!-- Book Grid List -->
          <div
            style="flex: 1; min-height: 0"
            class="overflow-auto d-flex flex-row flex-wrap justify-center align-content-start px-2 mt-2"
          >
            <v-skeleton-loader
              v-for="n in 10"
              v-show="loading_book"
              :key="n"
              class="ma-1"
              :height="80"
              :width="100"
            />
            <v-card
              v-for="book in books"
              :id="`listBook_${book.id_bible_book}`"
              :key="book.id_bible_book"
              :color="book.color"
              class="ma-1 d-flex align-center flex-column"
              :height="80"
              :width="100"
              hover
              :variant="book.id_bible_book == bible.id_bible_book ? 'flat' : 'tonal'"
              @click="selBook(book.id_bible_book)"
            >
              <v-card-title class="flex-grow-1 pa-0 ma-0 text-h4 d-flex align-center">
                {{ book.abbreviation }}
              </v-card-title>
              <v-card-text
                class="flex-grow-0 pa-0 px-1 ma-0 text-caption text-truncate text-center w-100"
              >
                {{ book.name }}
              </v-card-text>
            </v-card>
          </div>
        </div>

        <!-- compoenente dos versiculos -->
        <div class="w-30 h-100 d-flex flex-column pt-2">
          <!-- Chapter Search Menu (inline above chapter list) -->
          <div style="flex-shrink: 0" class="px-1">
            <l-select
              v-model="bible.chapter"
              :label="t('chapter')"
              :items="chaptersList"
              item-value="id"
              item-title="value"
              icon="mdi-bookmark"
            />
          </div>

          <!-- Chapter Grid List -->
          <div
            style="flex: 1; min-height: 0"
            class="overflow-auto d-flex flex-row flex-wrap justify-center align-content-start px-2 mt-2"
          >
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
      </div>
    </template>

    <template #right>
      <div class="d-flex flex-column h-100 pt-2">
        <!-- Verse Search Menu (above verse list) -->
        <div class="ps-1 pe-4 pb-3" style="flex-shrink: 0">
          <l-select
            v-if="!compact"
            v-model="bible_verses"
            :label="t('verses')"
            :items="versesList"
            item-value="id"
            item-title="value"
            multiple
            icon="mdi-format-list-numbered"
          />
        </div>

        <div class="mt-2" style="flex: 1; overflow: auto; min-height: 0">
          <v-skeleton-loader v-show="loading_book || loading_verses" type="list-item-two-line" />
          <v-list class="overflow h-100 ma-0 pa-0 no-select" width="100%">
            <v-list-item
              v-for="(verse, num) in verses"
              :id="`listVerse_${num}`"
              :key="num"
              link
              variant="flat"
              :value="verse"
              :active="bible.verses.includes(+num)"
              density="compact"
              @click="selVerse($event, num)"
            >
              <template #prepend>
                <v-chip class="mr-2">{{ num }}</v-chip>
              </template>

              <div class="text-caption" v-html="verse"></div>
            </v-list-item>
          </v-list>
        </div>
        <div style="height: 48px; flex-shrink: 0">
          <v-toolbar density="compact">
            <v-spacer />
            <v-divider vertical />
            <v-btn
              :disabled="!(select_bible?.verses && select_bible.verses.length > 0)"
              variant="text"
              size="small"
              icon="mdi-chevron-left"
              @click="prevVerse()"
            />
            <v-btn
              :disabled="!(select_bible?.verses && select_bible.verses.length > 0)"
              variant="text"
              size="small"
              icon="mdi-chevron-right"
              @click="nextVerse()"
            />
            <v-divider vertical />
            <v-btn
              :disabled="!(select_bible?.verses && select_bible.verses.length > 0)"
              variant="text"
              size="small"
              icon="mdi-eraser"
              @click="clean()"
            />
            <v-divider vertical />
            <LScreenBtn module="bible" />
          </v-toolbar>
        </div>
        <Screen />
      </div>
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
import LSelect from "@/components/inputs/LjSelect.vue";
import LScreenBtn from "@/components/buttons/Screen.vue";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import Hotkeys from "@/helpers/Hotkeys";
import Modules from "@/helpers/Modules";
import AppData from "@/helpers/AppData";
import Database from "@/helpers/Database";
import Broadcast from "@/helpers/Broadcast";

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

onMounted(async () => {
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
  await loadData();
});

onUnmounted(() => {
  Hotkeys.unregister("ArrowLeft", _hotkeyPrev);
  Hotkeys.unregister("ArrowRight", _hotkeyNext);
  Hotkeys.unregister("Delete", _hotkeyClean);
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

  const element = document.getElementById(`listBook_${id_bible_book}`);
  if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function selChapter(chapter) {
  if (chapter) bible.chapter = chapter;
  bible.verses = [];
  last_verse.value = 1;
  await loadData();

  const element = document.getElementById(`listChapter_${chapter}`);
  if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const element = document.getElementById(`listVerse_${last_verse.value}`);
  if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
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
</script>
