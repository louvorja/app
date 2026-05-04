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

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
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

const props = defineProps({
  modelValue: Object,
  file: String,
  search: String,
  scroll: { type: Object, default: () => ({}) },
  has_scroll: Boolean,
  searchable_fields: Object,
  filter: Object,
  letter: String,
  sort_by: String,
});

const emit = defineEmits(["update:modelValue"]);

const { t } = useI18n();

const all_data = ref([]);
const filter_data = ref([]);
const data = ref([]);
const limit = ref(0);
const error = ref(null);
const last_filter = ref({});
const loading = ref(true);
let _paginateRaf = null;

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));

// Versão com debounce de filterData para o watcher de search.
const debouncedFilterData = debounce(function () {
  filterData();
}, 300);

watch(
  () => props.file,
  async () => {
    await loadData();
  }
);

watch(
  () => props.search,
  () => {
    debouncedFilterData();
  }
);

watch(
  () => props.searchable_fields,
  () => compareFilterData()
);
watch(
  () => props.filter,
  () => compareFilterData()
);
watch(
  () => props.letter,
  () => compareFilterData()
);

watch(data, () => {
  emit("update:modelValue", {
    total_count: all_data.value.length,
    filter_count: filter_data.value.length,
    count: data.value.length,
    data: data.value,
  });
});

watch(
  () => props.scroll,
  () => {
    if (props.scroll.scroll_bottom <= 50 && data.value.length < filter_data.value.length) {
      paginateData();
    }
  }
);

onMounted(async () => {
  await loadData();
});

onBeforeUnmount(() => {
  if (_paginateRaf) cancelAnimationFrame(_paginateRaf);
});

async function loadData() {
  all_data.value = [];
  filter_data.value = [];
  data.value = [];
  loading.value = true;

  all_data.value = await Database.get(props.file);

  if (all_data.value == null) {
    error.value = t("components.datatable.alerts.not_found");
  }

  if (props.sort_by) {
    all_data.value.sort((a, b) => Strings.sort(a[props.sort_by], b[props.sort_by]));
  }
  filterData();
}

function filterData() {
  limit.value = 0;
  const value = Strings.clean(props.search);

  const searchable = props.searchable_fields
    ? Object.keys(props.searchable_fields).filter((key) => props.searchable_fields[key] === true)
    : [];
  const filter = props.filter
    ? Object.keys(props.filter).filter((key) => props.filter[key] === true)
    : [];

  filter_data.value = all_data.value
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
        props.letter === "" ||
        (props.letter === "#"
          ? /^[^a-zA-Z]/.test(item.name.normalize("NFD").replace(/[̀-ͯ]/g, ""))
          : item.name.normalize("NFD").replace(/[̀-ͯ]/g, "").startsWith(props.letter));

      return searchableCondition && filterCondition && initialLetter;
    })
    .slice();

  paginateData();
}

function paginateData() {
  const PAGE_SIZE = 100;
  limit.value += PAGE_SIZE;
  data.value = filter_data.value.slice(0, limit.value);
  loading.value = false;

  if (!props.has_scroll && data.value.length < filter_data.value.length) {
    if (_paginateRaf) cancelAnimationFrame(_paginateRaf);
    _paginateRaf = requestAnimationFrame(() => {
      paginateData();
    });
  }
}

function compareFilterData() {
  const filter = {
    searchable_fields: props.searchable_fields,
    filter: props.filter,
    letter: props.letter,
  };

  if (JSON.stringify(filter) === JSON.stringify(last_filter.value)) {
    return;
  }

  last_filter.value = filter;
  filterData();
}
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
