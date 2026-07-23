<template>
  <div>
    <Search v-model="search" :label="t('song.search')" />

    <DataTable
      class="d-none"
      v-model="data"
      :search="search"
      :searchable_fields="{ name: true, lyric: true }"
      letter=""
      sort_by="name"
      :file="`${$i18n.locale}_musics`"
    />

    <v-list
      class="mt-2"
      density="compact"
      style="max-height: 260px; overflow-y: auto"
    >
      <v-list-item
        v-for="item in data.data"
        :key="item.id_music"
        :active="selected?.id_music == item.id_music"
        @click="select(item)"
      >
        <v-list-item-title>{{ item.name }}</v-list-item-title>
        <v-list-item-subtitle v-if="item.albums && item.albums.length">
          {{ item.albums.map((album) => album.name).join(", ") }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <v-alert
      v-if="!selected"
      type="info"
      variant="tonal"
      density="compact"
      class="mt-2"
      :text="t('song.not_selected')"
    />

    <v-radio-group
      v-else
      v-model="mode"
      inline
      density="compact"
      hide-details
      :label="t('song.mode')"
      class="mt-2"
    >
      <v-radio :label="t('song.mode_audio')" value="audio" />
      <v-radio
        :label="t('song.mode_instrumental')"
        value="instrumental"
        :disabled="!selected.has_instrumental_music"
      />
      <v-radio :label="t('song.mode_no_audio')" value="no_audio" />
    </v-radio-group>
  </div>
</template>

<script>
import DataTable from "@/components/DataTable.vue";
import Search from "@/components/inputs/Search.vue";

export default {
  name: "LiturgySongPicker",
  components: {
    DataTable,
    Search,
  },
  props: {
    modelValue: Object,
  },
  emits: ["update:modelValue"],
  data: () => ({
    search: "",
    data: [],
    selected: null,
    mode: "audio",
  }),
  created() {
    if (this.modelValue) {
      this.selected = {
        id_music: this.modelValue.id_music,
        name: this.modelValue.name,
        has_instrumental_music: true,
      };
      this.mode = this.modelValue.mode || "audio";
    }
  },
  watch: {
    selected() {
      this.emitValue();
    },
    mode() {
      this.emitValue();
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.liturgy.${text}`);
    },
    select(item) {
      this.selected = item;
      if (!item.has_instrumental_music && this.mode == "instrumental") {
        this.mode = "audio";
      }
    },
    emitValue() {
      if (!this.selected) {
        this.$emit("update:modelValue", null);
        return;
      }
      this.$emit("update:modelValue", {
        title: this.selected.name,
        subtitle: "",
        id_music: this.selected.id_music,
        name: this.selected.name,
        mode: this.mode,
      });
    },
  },
};
</script>
