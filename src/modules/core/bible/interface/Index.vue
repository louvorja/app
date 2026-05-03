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
          :items="chaptersList()"
          item-value="id"
          item-title="value"
          icon="mdi-bookmark"
        />
        <div class="my-2" />
        <l-select
          v-model="bible_verses"
          :label="t('verses')"
          :items="versesList()"
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
              :items="chaptersList()"
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
            :items="versesList()"
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

<script>
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import Screen from "../components/Screen.vue";
import LSelect from "@/components/inputs/LjSelect.vue";
import LScreenBtn from "@/components/buttons/Screen.vue";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import Hotkeys from "@/helpers/Hotkeys";

export default {
  name: "CollectionsModule",
  components: {
    ModuleContainer,
    Screen,
    LScreenBtn,
    LSelect,
  },
  data: () => ({
    manifest,
    lang: null,
    loading: false,
    loading_book: false,
    loading_verses: false,
    tab: null,
    bible: {
      id_bible_version: null,
      id_bible_book: null,
      version: null,
      book: null,
      chapter: null,
      verses: [],
    },
    select_bible: {
      id_bible_version: null,
      id_bible_book: null,
      version: null,
      book: null,
      chapter: null,
      verses: [],
      scriptural_reference: null,
      text: null,
    },
    versions: [],
    books: [],
    verses: [],
    last_verse: 1,
    last_bible_file: null,
  }),
  computed: {
    /* COMPUTEDS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    module_id() {
      return manifest.id;
    },
    module() {
      return this.$modules.get(this.module_id);
    },
    userdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return this.$userdata.get(`modules.${this.module.id}.${key}`, null);
          },
          set: (_, key, value) => {
            this.$userdata.set(`modules.${this.module.id}.${key}`, value);
            return true;
          },
        }
      );
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */

    show() {
      return this.module.show;
    },

    bible_verses: {
      get() {
        //return Object.assign([], this.bible.verses);
        return this.bible.verses;
      },
      set(value) {
        if (value.length == 0) {
          this.clean();
          return;
        }
        if (value.length == 1) {
          this.selVerse(null, value[0]);
        } else {
          const added = value.filter((v) => !this.bible.verses.includes(v));
          const removed = this.bible.verses.filter((v) => !value.includes(v));

          const event = { ctrlKey: true };
          if (added.length > 0) {
            this.selVerse(event, added[0]);
          } else if (removed.length > 0) {
            this.selVerse(event, removed[0]);
          }
        }
      },
    },

    book() {
      return this.books.find((b) => b.id_bible_book == this.bible.id_bible_book);
    },
    version() {
      return this.versions.find((b) => b.id_bible_version == this.bible.id_bible_version);
    },
    chapters() {
      return this.book?.chapters;
    },
    versions_list() {
      return this.versions.map((version) => ({
        title: version.abbreviation + " - " + version.name,
        value: version.id_bible_version,
      }));
    },
    compact: function () {
      return this.$vuetify.display.width <= 750;
    },
    super_compact: function () {
      return this.$vuetify.display.width <= 400;
    },
  },
  watch: {
    async show() {
      if (this.show && this.lang != this.$i18n.locale) {
        this.versions = [];
        this.books = [];
        this.verses = [];
        this.bible = {
          id_bible_version: null,
          id_bible_book: null,
          version: null,
          book: null,
          chapter: null,
          verses: [],
        };
        this.select_bible = Object.assign({}, this.bible);
        await this.loadData();
      }
    },
    select_bible() {
      this.send("scriptural_reference", this.select_bible.scriptural_reference);
      this.send("text", this.select_bible.text);
    },
  },
  async mounted() {
    this._hotkeyPrev = () => {
      if (this.select_bible?.verses?.length > 0) this.prevVerse();
    };
    this._hotkeyNext = () => {
      if (this.select_bible?.verses?.length > 0) this.nextVerse();
    };
    this._hotkeyClean = () => {
      if (this.select_bible?.verses?.length > 0) this.clean();
    };
    Hotkeys.register("ArrowLeft", this._hotkeyPrev, {
      context: "bible",
      description: "hotkeys.bible_prev_verse",
      group: "bible",
      label: "←",
    });
    Hotkeys.register("ArrowRight", this._hotkeyNext, {
      context: "bible",
      description: "hotkeys.bible_next_verse",
      group: "bible",
      label: "→",
    });
    Hotkeys.register("Delete", this._hotkeyClean, {
      context: "bible",
      description: "hotkeys.bible_clear",
      group: "bible",
      label: "Del",
    });
    await this.loadData();
  },
  unmounted() {
    Hotkeys.unregister("ArrowLeft", this._hotkeyPrev);
    Hotkeys.unregister("ArrowRight", this._hotkeyNext);
    Hotkeys.unregister("Delete", this._hotkeyClean);
  },
  methods: {
    /* METHODS OBRIGATÓRIOS - INÍCIO */
    /* NÃO MODIFICAR */
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    /* METHODS OBRIGATÓRIOS - FIM */
    send(param, value) {
      this.$appdata.set(`modules.${this.module_id}.data.${param}`, value);
    },
    async loadData() {
      this.loading = true;

      if (this.books.length <= 0) {
        this.loading_book = true;
        this.books = await this.$database.get(`${this.$i18n.locale}_bible_book`);
        if (!this.bible.id_bible_book) {
          await this.selBook(this.books[0].id_bible_book);
        }
        this.loading_book = false;
      }

      if (this.versions.length <= 0) {
        this.versions = await this.$database.get(`${this.$i18n.locale}_bible_version`);
        if (!this.bible.id_bible_version) {
          await this.selVersion(this.versions[0].id_bible_version);
        }
      }

      const bible_file = `bible_${this.bible.id_bible_version}_${this.bible.id_bible_book}_${this.bible.chapter}`;
      if (bible_file != this.last_bible_file) {
        this.loading_verses = true;
        this.verses = {};
        this.verses = await this.$database.get(bible_file);
        this.last_bible_file = bible_file;
        this.loading_verses = false;
      }

      if (
        this.select_bible.id_bible_book == this.bible.id_bible_book &&
        this.select_bible.chapter == this.bible.chapter &&
        this.select_bible.id_bible_version == this.bible.id_bible_version
      ) {
        this.bible.verses = this.select_bible.verses;
      }

      this.lang = this.$i18n.locale;
      this.loading = false;
    },
    async selVersion(id_bible_version) {
      if (id_bible_version) {
        this.bible.id_bible_version = id_bible_version;
      }
      this.bible.version = this.version?.abbreviation;
      this.bible.verses = [];
      this.last_verse = 1;
      await this.loadData();
    },
    async selBook(id_bible_book) {
      if (id_bible_book) {
        this.bible.id_bible_book = id_bible_book;
      }
      this.bible.book = this.book.name;
      this.bible.verses = [];
      this.last_verse = 1;
      if (!this.bible.chapter) {
        this.selChapter(1);
      } else if (this.bible.chapter > this.book.chapters) {
        this.selChapter(this.book.chapters);
      } else {
        await this.loadData();
      }

      const element = document.getElementById(`listBook_${id_bible_book}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    async selChapter(chapter) {
      if (chapter) {
        this.bible.chapter = chapter;
      }
      this.bible.verses = [];
      this.last_verse = 1;
      await this.loadData();

      const element = document.getElementById(`listChapter_${chapter}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    async selVerse(event, num) {
      if (event) {
        try {
          event.preventDefault();
        } catch (e) {
          null;
        }
      }

      num = parseInt(num, 10);
      if (isNaN(num)) {
        return;
      }

      if (event?.ctrlKey) {
        const index = this.bible.verses.indexOf(num);
        if (index === -1) {
          this.bible.verses.push(num);
        } else {
          this.bible.verses.splice(index, 1);
        }
      } else if (event?.shiftKey) {
        const start = Math.min(num, this.last_verse);
        const end = Math.max(num, this.last_verse);
        for (let i = start; i <= end; i++) {
          if (!this.bible.verses.includes(i)) {
            this.bible.verses.push(i);
          }
        }
      } else {
        if (this.bible.verses.length == 1 && this.bible.verses[0] == num) {
          this.bible.verses.splice(0, 1);
          this.clean();
          return;
        }
        this.bible.verses = [num];
      }

      this.last_verse = num;
      this.bible.verses.sort((a, b) => a - b);
      this.select_bible = Object.assign({}, this.bible);
      this.select_bible.scriptural_reference = this.scripturalReference(this.select_bible);
      this.select_bible.text = this.getSelectedVerses(this.select_bible.verses);

      this.$broadcast.send(BROADCAST_TYPE.BIBLE_VERSE, {
        text: this.select_bible.text,
        reference: this.select_bible.scriptural_reference,
        active: true,
      });

      const element = document.getElementById(`listVerse_${this.last_verse}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    lastSelectedVerse(verse) {
      this.selVerse(null, +verse);
    },
    async prevVerse() {
      if (this.select_bible?.id_bible_version) {
        await this.selVersion(this.select_bible.id_bible_version);
      }
      if (this.select_bible?.id_bible_book) {
        await this.selBook(this.select_bible.id_bible_book);
      }
      if (this.select_bible?.chapter) {
        await this.selChapter(this.select_bible.chapter);
      }
      if (this.select_bible?.verses && this.select_bible.verses.length > 0) {
        let verse = Math.min(...this.select_bible.verses.filter((num) => num > 0));
        if (verse > 1) {
          verse--;
        } else if (this.select_bible.chapter > 1) {
          await this.selChapter(this.select_bible.chapter - 1);
          verse = Math.max(0, ...Object.keys(this.verses).map(Number));
        } else {
          let bookIndex = this.books.findIndex((b) => b.id_bible_book == this.bible.id_bible_book);
          const book =
            bookIndex > 0 ? this.books[bookIndex - 1] : this.books[this.books.length - 1];
          await this.selBook(book.id_bible_book);
          await this.selChapter(book.chapters);
          verse = Math.max(0, ...Object.keys(this.verses).map(Number));
        }
        this.selVerse(null, verse);
      }
    },
    async nextVerse() {
      if (this.select_bible?.id_bible_version) {
        await this.selVersion(this.select_bible.id_bible_version);
      }
      if (this.select_bible?.id_bible_book) {
        await this.selBook(this.select_bible.id_bible_book);
      }
      if (this.select_bible?.chapter) {
        await this.selChapter(this.select_bible.chapter);
      }
      if (this.select_bible?.verses && this.select_bible.verses.length > 0) {
        let verse = Math.max(...this.select_bible.verses);
        const max_verse = Math.max(0, ...Object.keys(this.verses).map(Number));
        const max_chapter = this.book.chapters;
        if (verse < max_verse) {
          verse++;
        } else if (this.select_bible.chapter < max_chapter) {
          await this.selChapter(this.select_bible.chapter + 1);
          verse = 1;
        } else {
          let bookIndex = this.books.findIndex((b) => b.id_bible_book == this.bible.id_bible_book);
          const book =
            bookIndex < this.books.length - 1 ? this.books[bookIndex + 1] : this.books[0];
          await this.selBook(book.id_bible_book);
          await this.selChapter(1);
          verse = 1;
        }
        this.selVerse(null, verse);
      }
    },
    chaptersList() {
      if (!this.chapters) {
        return [];
      }
      return Array.from({ length: this.chapters }, (_, index) => {
        return {
          id: index + 1,
          value: /*this.t("chapter") + " " +*/ index + 1,
        };
      });
    },
    versesList() {
      if (!this?.verses) {
        return [];
      }
      return Object.keys(this.verses).map((verse) => {
        return { id: +verse, value: /*this.t("verse") + " "*/ +verse };
      });
    },
    numbersInterval(numbers) {
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
    },
    scripturalReference(data) {
      const verses_interval = this.numbersInterval(data.verses);

      if (!data.book || !data.version) {
        return "";
      }

      return (
        data.book +
        " " +
        data.chapter +
        (verses_interval ? `:${verses_interval}` : "") +
        (data.version ? ` (${data.version})` : "")
      ).trim();
    },

    getSelectedVerses(keys) {
      keys.sort((a, b) => a - b); // Ordena os versículos para garantir a sequência correta
      let result = "";
      let previousKey = null;

      keys.forEach((key) => {
        if (previousKey !== null && key - previousKey > 1) {
          result += " [...] "; // Adiciona "..." se os versos não forem sequenciais
        } else if (result) {
          result += " "; // Adiciona um espaço entre versos consecutivos
        }
        result += this.verses[key];
        previousKey = key;
      });

      return result;
    },
    clean: function () {
      this.bible.verses = [];
      this.select_bible = {
        id_bible_version: null,
        id_bible_book: null,
        version: null,
        book: null,
        chapter: null,
        verses: [],
        scriptural_reference: null,
        text: null,
      };
    },

    close() {
      this.bible.verses = [];
      this.select_bible = {
        id_bible_version: null,
        id_bible_book: null,
        version: null,
        book: null,
        chapter: null,
        verses: [],
        scriptural_reference: null,
        text: null,
      };
    },
  },
};
</script>
