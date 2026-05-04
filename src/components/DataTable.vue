<template>
  <v-table fixed-header hover loading density="compact" class="__table-data">
    <template #bottom>
      <v-progress-linear v-if="loading" :color="primaryColor" indeterminate />
      <v-alert
        v-if="error"
        type="error"
        :text="error"
        variant="tonal"
        border="start"
        class="ma-2"
      />
    </template>
    <slot />
  </v-table>
</template>

<script>
import Database from "@/helpers/Database";
import Strings from "@/helpers/Strings";
import AppData from "@/helpers/AppData";

// Debounce leve: aguarda `ms` ms de inatividade antes de executar `fn`.
function debounce(fn, ms = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

export default {
  name: "DataTableComponent",
  props: {
    modelValue: Object,
    file: String,
    search: String,
    scroll: { type: Object, default: () => ({}) },
    has_scroll: Boolean,
    searchable_fields: Object,
    filter: Object,
    letter: String,
    sort_by: String,
  },
  data: () => ({
    all_data: [],
    filter_data: [],
    data: [],
    limit: 0,
    error: null,
    last_filter: {},
    loading: true,
  }),
  computed: {
    primaryColor() {
      return AppData.get("is_dark") ? undefined : "primary";
    },
  },
  watch: {
    async file() {
      await this.loadData();
    },
    search() {
      this._debouncedFilterData();
    },
    searchable_fields() {
      this.compareFilterData();
    },
    filter() {
      this.compareFilterData();
    },
    letter() {
      this.compareFilterData();
    },
    async data() {
      this.$emit("update:modelValue", {
        total_count: this.all_data.length,
        filter_count: this.filter_data.length,
        count: this.data.length,
        data: this.data,
      });
    },
    async scroll() {
      if (this.scroll.scroll_bottom <= 50 && this.data.length < this.filter_data.length) {
        this.paginateData();
      }
    },
  },
  created() {
    // Cria versão com debounce de filterData para o watcher de search.
    // O v-model do Search.vue continua atualizando em tempo real (UI responsiva),
    // mas o filtro real só dispara após 300ms de inatividade.
    this._debouncedFilterData = debounce(function () {
      this.filterData();
    }, 300);
  },
  async mounted() {
    await this.loadData();
  },
  beforeUnmount() {
    if (this._paginateRaf) cancelAnimationFrame(this._paginateRaf);
  },
  methods: {
    async loadData() {
      this.all_data = [];
      this.filter_data = [];
      this.data = [];
      this.loading = true;

      this.all_data = await Database.get(this.file);

      if (this.all_data == null) {
        this.error = this.$t("components.datatable.alerts.not_found");
      }

      if (this.sort_by) {
        this.all_data.sort((a, b) => Strings.sort(a[this.sort_by], b[this.sort_by]));
      }
      this.filterData();
    },
    filterData() {
      this.limit = 0;
      const value = Strings.clean(this.search);

      let searchable = this.searchable_fields
        ? Object.keys(this.searchable_fields).filter((key) => this.searchable_fields[key] === true)
        : [];
      let filter = this.filter
        ? Object.keys(this.filter).filter((key) => this.filter[key] === true)
        : [];
      this.filter_data = this.all_data
        .filter((item) => {
          const searchableCondition =
            searchable.length === 0 ||
            value == "" ||
            searchable.some((key) => {
              if (key === "track" && item.albums) {
                return item.albums.some((album) => {
                  const isHymnal = album.name && album.type == "hymnal";
                  return isHymnal && album.pivot && Number(album.pivot.track) === Number(value);
                });
              }

              if (!isNaN(item[key]) && !isNaN(value)) {
                return Number(item[key]) === Number(value);
              } else if (isNaN(item[key])) {
                return Strings.clean(item[key]).includes(value);
              } else {
                return false;
              }
            });

          const filterCondition =
            filter.length === 0 || filter.some((key) => item[key] === true || item[key] === 1);

          const initialLetter =
            this.letter === "" ||
            (this.letter === "#"
              ? /^[^a-zA-Z]/.test(item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
              : item.name
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .startsWith(this.letter));

          return searchableCondition && filterCondition && initialLetter;
        })
        .slice();

      this.paginateData();
    },
    paginateData() {
      // Página maior reduz drasticamente o número de re-renders no boot
      // (antes: 10/100ms = 70 ciclos para 700 itens). Agora: 100 por chunk.
      const PAGE_SIZE = this.limit === 0 ? 100 : 100;
      this.limit += PAGE_SIZE;
      this.data = this.filter_data.slice(0, this.limit);
      this.loading = false;

      // Continua paginando em background apenas se ainda há itens não exibidos
      // E o componente ainda não detectou scroll do usuário (lazy load).
      // Usa rAF em vez de setTimeout para não bloquear UI thread.
      if (!this.has_scroll && this.data.length < this.filter_data.length) {
        if (this._paginateRaf) cancelAnimationFrame(this._paginateRaf);
        this._paginateRaf = requestAnimationFrame(() => {
          this.paginateData();
        });
      }
    },

    compareFilterData() {
      let filter = {
        searchable_fields: this.searchable_fields,
        filter: this.filter,
        letter: this.letter,
      };

      if (JSON.stringify(filter) === JSON.stringify(this.last_filter)) {
        return;
      }

      this.last_filter = filter;

      this.filterData();
    },
  },
};
</script>

<style>
/* DataTable padronizado — usa tokens do design system */
/* Duplicação de .__table-data garante especificidade (0,2,0)+(0,1,0) > Vuetify (0,2,0) sem !important */
.__table-data.__table-data .v-table__wrapper {
  overflow: initial;
}

.__table-data.__table-data {
  font-family: var(--lj-font-shell);
  font-size: var(--lj-text-base);
}

/* Cabeçalho */
.__table-data.__table-data thead tr th {
  background: var(--lj-surface-bg-soft);
  color: var(--lj-text-muted);
  font-size: var(--lj-text-xs);
  font-weight: var(--lj-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--lj-surface-border-strong);
  padding: var(--lj-space-3) var(--lj-space-4);
}

/* Linhas */
.__table-data.__table-data tbody tr {
  transition: background var(--lj-transition-fast);
}

.__table-data.__table-data tbody tr:hover {
  background: var(--lj-surface-bg-hover);
  cursor: default;
}

.__table-data.__table-data tbody td {
  padding: var(--lj-space-2) var(--lj-space-4);
  border-bottom: 1px solid var(--lj-surface-divider);
  color: var(--lj-text);
  font-size: var(--lj-text-base);
}

/* Linha selecionada */
.__table-data.__table-data tbody tr.v-data-table-row--active,
.__table-data.__table-data tbody tr.selected {
  background: var(--lj-active-bg);
}

/* Indicador de loading */
.__table-data.__table-data .v-progress-linear {
  height: 2px;
}

/* Empty state */
.__table-data.__table-data + .v-alert {
  margin-top: var(--lj-space-4);
}
</style>
