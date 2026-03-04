<template>
  <v-table fixed-header hover loading density="compact" class="__table-data">
    <template v-slot:bottom>
      <v-progress-linear
        v-if="loading"
        :color="$theme.primary()"
        indeterminate
      />
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
  watch: {
    async file() {
      await this.loadData();
    },
    search() {
      this.filterData();
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
      if (
        this.scroll.scroll_bottom <= 50 &&
        this.data.length < this.filter_data.length
      ) {
        this.paginateData();
      }
    },
  },
  methods: {
    async loadData() {
      this.all_data = [];
      this.filter_data = [];
      this.data = [];
      this.loading = true;

      this.all_data = await this.$database.get(this.file);

      if (this.all_data == null) {
        this.error = this.$t("components.datatable.alerts.not_found");
      }

      if (this.sort_by) {
        this.all_data.sort((a, b) =>
          this.$string.sort(a[this.sort_by], b[this.sort_by])
        );
      }
      this.filterData();
    },
    filterData() {
      this.limit = 0;
      const value = this.$string.clean(this.search);

      let searchable = this.searchable_fields
        ? Object.keys(this.searchable_fields).filter(
            (key) => this.searchable_fields[key] === true
          )
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
                  // Only search by track in hymnal (id_album: 1, name: "Hinário Adventista - 1996" or "Hinário Adventista")
                  // Since we might not know the exact IDs for sure without checking the db, it's safer to check known names or a specific property if it existed,
                  // but typically "Hinário Adventista" and "Hinário Adventista - 1996" are explicitly named.
                  // Let's filter by album name containing "Hinário Adventista".
                  const isHymnal = album.name && album.name.includes("Hinário Adventista");
                  return isHymnal && album.pivot && Number(album.pivot.track) === Number(value);
                });
              }

              if (!isNaN(item[key]) && !isNaN(value)) {
                return Number(item[key]) === Number(value);
              } else if (isNaN(item[key])) {
                return this.$string.clean(item[key]).includes(value);
              } else {
                return false;
              }
            });

          const filterCondition =
            filter.length === 0 ||
            filter.some((key) => item[key] === true || item[key] === 1);

          const initialLetter =
            this.letter === "" ||
            (this.letter === "#"
              ? /^[^a-zA-Z]/.test(
                  item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                )
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
      this.limit += 10;
      this.data = this.filter_data.slice(0, this.limit);
      this.loading = false;

      const self = this;
      setTimeout(() => {
        if (!self.has_scroll && self.data.length < self.filter_data.length) {
          self.paginateData();
        }
      }, 100);
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
  async mounted() {
    await this.loadData();
  },
};
</script>

<style>
.__table-data .v-table__wrapper {
  overflow: initial !important;
}
</style>
