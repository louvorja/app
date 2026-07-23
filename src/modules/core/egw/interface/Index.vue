<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <template v-slot:header>
      <v-tabs v-model="tab" density="compact">
        <v-tab value="search">{{ t("tabs.search") }}</v-tab>
        <v-tab value="books">{{ t("tabs.books") }}</v-tab>
      </v-tabs>
    </template>

    <v-alert
      v-if="fatalError"
      type="warning"
      variant="tonal"
      class="ma-3"
      :text="fatalError"
    />

    <!-- BUSCAR -->
    <div v-else-if="tab == 'search'" class="pa-4" style="height: 100%; overflow-y: auto">
      <v-text-field
        v-model="search.query"
        :label="t('search.label')"
        :hint="t('search.hint')"
        persistent-hint
        density="compact"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        clearable
        @keydown.enter="doSearch"
        @click:clear="clearSearch"
      >
        <template v-slot:append>
          <v-btn color="primary" variant="flat" :loading="search.loading" @click="doSearch">
            {{ t("tabs.search") }}
          </v-btn>
        </template>
      </v-text-field>

      <div class="mt-4">
        <div v-if="search.error" class="text-error">{{ search.error }}</div>
        <div
          v-else-if="!search.query && !search.results.length"
          class="text-medium-emphasis"
        >
          {{ t("search.empty") }}
        </div>
        <div
          v-else-if="!search.loading && search.results.length == 0 && search.searched"
          class="text-medium-emphasis"
        >
          {{ t("search.no_results") }}
        </div>
        <template v-else>
          <div v-if="search.total" class="text-caption text-medium-emphasis mb-2">
            {{ t("search.results_count", { n: search.total }) }}
          </div>
          <v-card
            v-for="(item, index) in search.results"
            :key="index"
            variant="outlined"
            class="mb-2"
          >
            <v-card-text>
              <div class="text-caption font-weight-medium text-primary mb-1">
                {{ item.refcode_long }}
              </div>
              <div class="text-body-2" v-html="item.snippet" />
              <v-btn
                class="mt-2"
                size="small"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-cast"
                @click="playSearchResult(item)"
              >
                {{ t("play") }}
              </v-btn>
            </v-card-text>
          </v-card>
        </template>
      </div>
    </div>

    <!-- LIVROS -->
    <!-- Mobile: navegação em passos (só uma coluna por vez, com botão de
         voltar) — os 3 painéis lado a lado do desktop não cabem numa tela
         de celular. -->
    <div v-else-if="isMobile" style="height: 100%; overflow-y: auto">
      <template v-if="!books.selectedBookId">
        <v-progress-linear v-if="books.loading" indeterminate />
        <v-list density="compact" nav>
          <v-list-item
            v-for="book in books.list"
            :key="book.book_id"
            link
            @click="selectBook(book)"
          >
            <v-list-item-title class="text-truncate">{{ book.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>

      <template v-else-if="!books.selectedPara">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" class="ma-2" @click="books.selectedBookId = null">
          {{ t("book.label") }}
        </v-btn>
        <v-progress-linear v-if="books.loadingToc" indeterminate />
        <v-list density="compact" nav>
          <v-list-item
            v-for="entry in books.toc"
            :key="entry.para_id"
            link
            :style="{ paddingLeft: `${12 + (entry.level || 0) * 14}px` }"
            @click="selectTocEntry(entry)"
          >
            <v-list-item-title class="text-truncate text-body-2">
              {{ entry.title }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </template>

      <template v-else>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" class="ma-2" @click="books.selectedPara = null">
          {{ t("toc.select") }}
        </v-btn>
        <div class="pa-4 pt-0">
          <v-progress-linear v-if="books.loadingChapter" indeterminate class="mb-2" />
          <template v-for="para in books.chapterParagraphs" :key="para.para_id">
            <div
              v-if="para.element_type != 'p'"
              class="font-weight-bold mt-3 mb-1"
              :class="para.element_type == 'h1' ? 'text-h6' : 'text-subtitle-1'"
              v-html="para.content"
            />
            <v-card v-else variant="outlined" class="mb-2">
              <v-card-text>
                <div class="text-caption font-weight-medium text-primary mb-1">
                  {{ para.refcode_long }}
                </div>
                <div class="text-body-2" v-html="para.content" />
                <v-btn
                  class="mt-2"
                  size="small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-cast"
                  @click="playParagraph(para)"
                >
                  {{ t("play") }}
                </v-btn>
              </v-card-text>
            </v-card>
          </template>
        </div>
      </template>
    </div>

    <!-- Desktop: 3 colunas lado a lado -->
    <div v-else class="d-flex align-stretch" style="height: 100%; overflow: hidden">
      <div style="width: 260px; min-width: 260px; overflow-y: auto" class="border-e">
        <v-progress-linear v-if="books.loading" indeterminate />
        <v-list density="compact" nav>
          <v-list-item
            v-for="book in books.list"
            :key="book.book_id"
            :active="book.book_id == books.selectedBookId"
            link
            @click="selectBook(book)"
          >
            <v-list-item-title class="text-truncate">{{ book.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <div style="width: 280px; min-width: 280px; overflow-y: auto" class="border-e">
        <v-progress-linear v-if="books.loadingToc" indeterminate />
        <div v-if="!books.selectedBookId" class="pa-4 text-medium-emphasis">
          {{ t("book.select") }}
        </div>
        <v-list v-else density="compact" nav>
          <v-list-item
            v-for="entry in books.toc"
            :key="entry.para_id"
            :active="entry.para_id == books.selectedPara"
            link
            :style="{ paddingLeft: `${12 + (entry.level || 0) * 14}px` }"
            @click="selectTocEntry(entry)"
          >
            <v-list-item-title class="text-truncate text-body-2">
              {{ entry.title }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <div class="flex-grow-1 pa-4" style="overflow-y: auto">
        <v-progress-linear v-if="books.loadingChapter" indeterminate class="mb-2" />
        <div v-if="!books.selectedPara" class="text-medium-emphasis">
          {{ t("toc.select") }}
        </div>
        <template v-else>
          <template v-for="para in books.chapterParagraphs" :key="para.para_id">
            <div
              v-if="para.element_type != 'p'"
              class="font-weight-bold mt-3 mb-1"
              :class="para.element_type == 'h1' ? 'text-h6' : 'text-subtitle-1'"
              v-html="para.content"
            />
            <v-card v-else variant="outlined" class="mb-2">
              <v-card-text>
                <div class="text-caption font-weight-medium text-primary mb-1">
                  {{ para.refcode_long }}
                </div>
                <div class="text-body-2" v-html="para.content" />
                <v-btn
                  class="mt-2"
                  size="small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-cast"
                  @click="playParagraph(para)"
                >
                  {{ t("play") }}
                </v-btn>
              </v-card-text>
            </v-card>
          </template>
        </template>
      </div>
    </div>
  </ModuleContainer>
</template>

<script>
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";

export default {
  name: manifest.id,
  components: {
    ModuleContainer,
  },
  data: () => ({
    tab: "search",
    fatalError: null,
    search: {
      query: "",
      loading: false,
      searched: false,
      results: [],
      total: 0,
      error: null,
    },
    books: {
      list: [],
      loading: false,
      selectedBookId: null,
      toc: [],
      loadingToc: false,
      selectedPara: null,
      chapterParagraphs: [],
      loadingChapter: false,
    },
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
    /* COMPUTEDS OBRIGATÓRIAS - FIM */

    manifest() {
      return manifest;
    },
    lang() {
      return this.$i18n.locale == "es" ? "es" : "pt";
    },
    isMobile() {
      return this.$vuetify.display.width <= 600;
    },
  },
  watch: {
    tab(value) {
      if (value == "books" && !this.books.list.length) {
        this.loadBooks();
      }
    },
  },
  methods: {
    t(text, params) {
      return this.$t(`modules.${this.module_id}.${text}`, params);
    },
    async doSearch() {
      if (!this.search.query || this.search.loading) {
        return;
      }
      this.search.loading = true;
      this.search.error = null;
      try {
        const data = await this.$egw.search(this.search.query, this.lang, 20);
        this.search.results = data.results || [];
        this.search.total = data.total || 0;
        this.search.searched = true;
      } catch (e) {
        this.search.error = this.t("error_generic");
        console.warn("[EGW] search failed:", e);
      } finally {
        this.search.loading = false;
      }
    },
    clearSearch() {
      this.search.query = "";
      this.search.results = [];
      this.search.total = 0;
      this.search.searched = false;
      this.search.error = null;
    },
    playSearchResult(item) {
      this.$egw.project(this.$egw.stripHtml(item.snippet), item.refcode_long);
    },
    async loadBooks() {
      this.books.loading = true;
      try {
        const data = await this.$egw.books(this.lang, 100);
        this.books.list = (data.results || []).sort((a, b) => a.title.localeCompare(b.title));
      } catch (e) {
        this.fatalError = this.t("error_generic");
        console.warn("[EGW] books failed:", e);
      } finally {
        this.books.loading = false;
      }
    },
    async selectBook(book) {
      this.books.selectedBookId = book.book_id;
      this.books.selectedPara = null;
      this.books.chapterParagraphs = [];
      this.books.loadingToc = true;
      try {
        this.books.toc = (await this.$egw.toc(book.book_id)) || [];
      } catch (e) {
        console.warn("[EGW] toc failed:", e);
        this.books.toc = [];
      } finally {
        this.books.loadingToc = false;
      }
    },
    async selectTocEntry(entry) {
      this.books.selectedPara = entry.para_id;
      this.books.loadingChapter = true;
      try {
        this.books.chapterParagraphs =
          (await this.$egw.chapter(this.books.selectedBookId, entry.para_id)) || [];
      } catch (e) {
        console.warn("[EGW] chapter failed:", e);
        this.books.chapterParagraphs = [];
      } finally {
        this.books.loadingChapter = false;
      }
    },
    playParagraph(para) {
      this.$egw.project(this.$egw.stripHtml(para.content), para.refcode_long);
    },
  },
};
</script>
