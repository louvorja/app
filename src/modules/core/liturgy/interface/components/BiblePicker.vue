<template>
  <div>
    <v-row dense>
      <v-col cols="12" sm="6">
        <LSelect
          :label="t('bible.book')"
          v-model="bible.id_bible_book"
          :items="books"
          item-value="id_bible_book"
          item-title="name"
        />
      </v-col>
      <v-col cols="6" sm="3">
        <LSelect
          :label="t('bible.chapter')"
          v-model="bible.chapter"
          :items="chaptersList"
          item-value="id"
          item-title="value"
        />
      </v-col>
      <v-col cols="6" sm="3">
        <LSelect
          :label="t('bible.version')"
          v-model="bible.id_bible_version"
          :items="versions"
          item-value="id_bible_version"
          item-title="abbreviation"
        />
      </v-col>
    </v-row>

    <LSelect
      class="mt-2"
      :label="t('bible.verses')"
      v-model="bible.verses"
      :items="versesList"
      item-value="id"
      item-title="value"
      multiple
    />

    <v-alert
      v-if="!bible.verses.length"
      type="info"
      variant="tonal"
      density="compact"
      class="mt-2"
      :text="t('bible.not_selected')"
    />
    <v-sheet v-else class="pa-2 mt-2" border rounded>
      <div class="text-body-2">{{ previewText }}</div>
      <div class="text-caption text-medium-emphasis mt-1">
        {{ previewReference }}
      </div>
    </v-sheet>
  </div>
</template>

<script>
import LSelect from "@/components/inputs/Select.vue";

export default {
  name: "LiturgyBiblePicker",
  components: {
    LSelect,
  },
  props: {
    modelValue: Object,
  },
  emits: ["update:modelValue"],
  data: () => ({
    books: [],
    versions: [],
    verses: {},
    bible: {
      id_bible_book: null,
      chapter: null,
      id_bible_version: null,
      verses: [],
    },
    last_bible_file: null,
  }),
  computed: {
    book() {
      return this.books.find(
        (book) => book.id_bible_book == this.bible.id_bible_book,
      );
    },
    version() {
      return this.versions.find(
        (version) => version.id_bible_version == this.bible.id_bible_version,
      );
    },
    chaptersList() {
      if (!this.book?.chapters) {
        return [];
      }
      return Array.from({ length: this.book.chapters }, (_, index) => ({
        id: index + 1,
        value: index + 1,
      }));
    },
    versesList() {
      return Object.keys(this.verses).map((verse) => ({
        id: +verse,
        value: +verse,
      }));
    },
    previewText() {
      const keys = [...this.bible.verses].sort((a, b) => a - b);
      let result = "";
      let previous = null;
      keys.forEach((key) => {
        if (previous !== null && key - previous > 1) {
          result += " [...] ";
        } else if (result) {
          result += " ";
        }
        result += this.verses[key];
        previous = key;
      });
      return result;
    },
    previewReference() {
      if (!this.book || !this.version) {
        return "";
      }
      const numbers = [...this.bible.verses].sort((a, b) => a - b);
      let intervals = [];
      let start = numbers[0];
      let end = numbers[0];
      for (let i = 1; i <= numbers.length; i++) {
        if (numbers[i] === end + 1) {
          end = numbers[i];
        } else {
          intervals.push(start === end ? `${start}` : `${start}-${end}`);
          start = numbers[i];
          end = numbers[i];
        }
      }
      return `${this.book.name} ${this.bible.chapter}:${intervals.join(", ")} (${this.version.abbreviation})`;
    },
  },
  watch: {
    async "bible.id_bible_book"() {
      if (!this.bible.chapter) {
        this.bible.chapter = 1;
      } else if (this.book && this.bible.chapter > this.book.chapters) {
        this.bible.chapter = this.book.chapters;
      }
      this.bible.verses = [];
      await this.loadVerses();
    },
    async "bible.chapter"() {
      this.bible.verses = [];
      await this.loadVerses();
    },
    async "bible.id_bible_version"() {
      this.bible.verses = [];
      await this.loadVerses();
    },
    "bible.verses"() {
      this.emitValue();
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.liturgy.${text}`);
    },
    async loadVerses() {
      if (
        !this.bible.id_bible_book ||
        !this.bible.chapter ||
        !this.bible.id_bible_version
      ) {
        return;
      }
      const file = `bible_${this.bible.id_bible_version}_${this.bible.id_bible_book}_${this.bible.chapter}`;
      if (file == this.last_bible_file) {
        return;
      }
      this.verses = (await this.$database.get(file)) || {};
      this.last_bible_file = file;
    },
    emitValue() {
      if (!this.bible.verses.length || !this.book || !this.version) {
        this.$emit("update:modelValue", null);
        return;
      }
      this.$emit("update:modelValue", {
        title: this.previewReference,
        subtitle: this.previewText,
        text: this.previewText,
        scriptural_reference: this.previewReference,
      });
    },
  },
  async created() {
    this.books = (await this.$database.get(`${this.$i18n.locale}_bible_book`)) || [];
    this.versions =
      (await this.$database.get(`${this.$i18n.locale}_bible_version`)) || [];

    if (this.books.length) {
      this.bible.id_bible_book = this.books[0].id_bible_book;
    }
    if (this.versions.length) {
      this.bible.id_bible_version = this.versions[0].id_bible_version;
    }
    this.bible.chapter = 1;
    await this.loadVerses();
  },
};
</script>
