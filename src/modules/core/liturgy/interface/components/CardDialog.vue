<template>
  <v-dialog v-model="show" max-width="600" scrollable persistent>
    <v-card>
      <v-card-title>{{ card ? t("card.edit") : t("card.add") }}</v-card-title>
      <v-card-text>
        <v-btn-toggle
          v-model="type"
          density="compact"
          variant="outlined"
          mandatory
          divided
          class="mb-4 w-100"
        >
          <v-btn value="song" class="flex-grow-1">
            <v-icon start icon="mdi-music-note" />
            {{ t("card.types.song") }}
          </v-btn>
          <v-btn value="bible" class="flex-grow-1">
            <v-icon start icon="mdi-book-cross" />
            {{ t("card.types.bible") }}
          </v-btn>
          <v-btn value="link" class="flex-grow-1">
            <v-icon start icon="mdi-link-variant" />
            {{ t("card.types.link") }}
          </v-btn>
          <v-btn value="media" class="flex-grow-1">
            <v-icon start icon="mdi-image-multiple" />
            {{ t("card.types.media") }}
          </v-btn>
        </v-btn-toggle>

        <SongPicker v-if="type == 'song'" v-model="payload" />
        <BiblePicker v-else-if="type == 'bible'" v-model="payload" />
        <MediaLinkPicker
          v-else-if="type == 'link'"
          type="link"
          v-model="payload"
        />
        <MediaLinkPicker
          v-else-if="type == 'media'"
          type="media"
          v-model="payload"
        />

        <v-divider class="my-4" />
        <v-textarea
          v-model="notes"
          :label="t('card.notes')"
          :hint="t('card.notes_hint')"
          persistent-hint
          density="compact"
          variant="outlined"
          rows="2"
          auto-grow
          prepend-inner-icon="mdi-note-text-outline"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="close">{{ t("actions.cancel") }}</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!payload"
          @click="save"
        >
          {{ t("actions.save") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import SongPicker from "./SongPicker.vue";
import BiblePicker from "./BiblePicker.vue";
import MediaLinkPicker from "./MediaLinkPicker.vue";

export default {
  name: "LiturgyCardDialog",
  components: {
    SongPicker,
    BiblePicker,
    MediaLinkPicker,
  },
  props: {
    modelValue: Boolean,
    card: Object,
  },
  emits: ["update:modelValue", "save"],
  data: () => ({
    type: "song",
    payload: null,
    notes: "",
  }),
  computed: {
    show: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  watch: {
    show(value) {
      if (value) {
        this.type = this.card?.type || "song";
        this.payload = this.card?.payload || null;
        this.notes = this.card?.notes || "";
      }
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.liturgy.${text}`);
    },
    close() {
      this.show = false;
    },
    save() {
      if (!this.payload) {
        return;
      }
      this.$emit("save", { type: this.type, payload: this.payload, notes: this.notes });
      this.show = false;
    },
  },
};
</script>
