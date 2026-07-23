<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <template v-slot:header>
      <div class="d-flex align-center">
        <v-tabs v-model="activeDay" density="compact" show-arrows class="flex-grow-1">
          <v-tab v-for="day in weekdays" :key="day" :value="day">
            {{ t(`weekdays.${day}`) }}
          </v-tab>
        </v-tabs>

        <v-btn
          icon="mdi-file-pdf-box"
          variant="text"
          size="small"
          :title="t('export.pdf_tooltip')"
          @click="exportDialog = true"
        />
        <v-btn
          icon="mdi-download"
          variant="text"
          size="small"
          :title="t('export.backup_tooltip')"
          @click="exportBackup"
        />
        <v-btn
          icon="mdi-upload"
          variant="text"
          size="small"
          :title="t('export.import_tooltip')"
          @click="triggerImport"
        />
        <input
          ref="importInput"
          type="file"
          accept="application/json"
          class="d-none"
          @change="onImportFile"
        />
      </div>
    </template>

    <div class="d-flex align-start" style="overflow-x: auto; min-height: 100%">
      <draggable
        v-model="board.columns"
        group="liturgy-columns"
        item-key="id"
        class="d-flex align-start"
        handle=".liturgy-column-handle"
      >
        <template #item="{ element: column }">
          <v-card class="ma-2" width="280" variant="tonal">
            <v-card-title
              class="d-flex align-center pa-2 liturgy-column-handle"
              style="cursor: move"
            >
              <v-text-field
                v-model="column.name"
                density="compact"
                variant="plain"
                hide-details
                class="flex-grow-1"
              />
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                @click="removeColumn(column)"
              />
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-2" style="min-height: 90px">
              <draggable
                v-model="column.cards"
                group="liturgy-cards"
                item-key="id"
                class="d-flex flex-column"
                style="min-height: 60px"
              >
                <template #item="{ element: card }">
                  <v-card class="mb-2" variant="outlined">
                    <v-card-text class="pa-2 d-flex align-center">
                      <v-icon :icon="cardIcon(card.type)" class="me-2" />
                      <div class="flex-grow-1 text-truncate">
                        <div class="text-body-2 text-truncate">
                          {{ card.title }}
                        </div>
                        <div
                          v-if="card.subtitle"
                          class="text-caption text-medium-emphasis text-truncate"
                        >
                          {{ card.subtitle }}
                        </div>
                      </div>
                      <v-btn
                        :icon="isPlaying(card) ? 'mdi-stop' : 'mdi-play'"
                        :color="isPlaying(card) ? 'error' : 'primary'"
                        :title="isPlaying(card) ? t('card.stop') : t('card.play')"
                        variant="text"
                        size="small"
                        @click="togglePlay(card)"
                      />
                      <v-btn
                        icon="mdi-pencil"
                        :title="t('card.edit')"
                        variant="text"
                        size="small"
                        @click="editCard(column, card)"
                      />
                      <v-btn
                        icon="mdi-close"
                        :title="t('card.delete')"
                        variant="text"
                        size="small"
                        @click="removeCard(column, card)"
                      />
                    </v-card-text>
                  </v-card>
                </template>
              </draggable>

              <div
                v-if="!column.cards.length"
                class="text-caption text-medium-emphasis text-center pa-2"
              >
                {{ t("column.empty") }}
              </div>

              <v-btn
                block
                variant="text"
                prepend-icon="mdi-plus"
                @click="addCard(column)"
              >
                {{ t("card.add") }}
              </v-btn>
            </v-card-text>
          </v-card>
        </template>
      </draggable>

      <v-btn
        class="ma-2"
        variant="tonal"
        prepend-icon="mdi-plus"
        @click="addColumn"
      >
        {{ t("column.add") }}
      </v-btn>
    </div>

    <CardDialog v-model="dialog" :card="editingCard" @save="saveCard" />
    <ExportPdfDialog
      v-model="exportDialog"
      :active-day="activeDay"
      @confirm="onExportPdfConfirm"
    />
  </ModuleContainer>
</template>

<script>
import draggable from "vuedraggable";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import CardDialog from "./components/CardDialog.vue";
import ExportPdfDialog from "./components/ExportPdfDialog.vue";
import { WEEKDAYS } from "@/helpers/Liturgy";

export default {
  name: manifest.id,
  components: {
    ModuleContainer,
    draggable,
    CardDialog,
    ExportPdfDialog,
  },
  data: () => ({
    weekdays: WEEKDAYS,
    activeDay: WEEKDAYS[0],
    liturgy: null,
    dialog: false,
    editingCard: null,
    editingColumnId: null,
    exportDialog: false,
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
    board() {
      return this.liturgy[this.activeDay];
    },
  },
  watch: {
    liturgy: {
      deep: true,
      handler() {
        this.$liturgy.save(this.liturgy);
      },
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    cardIcon(type) {
      return (
        {
          song: "mdi-music-note",
          bible: "mdi-book-cross",
          link: "mdi-link-variant",
          media: "mdi-image-multiple",
        }[type] || "mdi-file"
      );
    },
    isPlaying(card) {
      if (!this.$appdata.get("popup")) {
        return false;
      }
      const popupModule = this.$appdata.get("popup_module");

      if (card.type == "song") {
        return (
          popupModule == "media" &&
          this.$appdata.get("modules.media.id_music") == card.payload.id_music
        );
      }
      if (card.type == "bible") {
        return (
          popupModule == "bible" &&
          this.$appdata.get("modules.bible.data.scriptural_reference") ==
            card.payload.scriptural_reference
        );
      }
      if (card.type == "link" || card.type == "media") {
        return (
          popupModule == "link" &&
          this.$appdata.get("modules.link.data.url") == card.payload.url
        );
      }
      return false;
    },
    togglePlay(card) {
      if (this.isPlaying(card)) {
        this.$popup.exit();
      } else {
        this.$liturgy.play(card);
      }
    },
    addColumn() {
      this.$liturgy.addColumn(this.board, this.t("column.add"));
    },
    removeColumn(column) {
      this.$alert.yesno(`modules.${this.module_id}.column.delete_confirm`, (btn) => {
        if (btn == "yes") {
          this.$liturgy.removeColumn(this.board, column.id);
        }
      });
    },
    addCard(column) {
      this.editingColumnId = column.id;
      this.editingCard = null;
      this.dialog = true;
    },
    editCard(column, card) {
      this.editingColumnId = column.id;
      this.editingCard = card;
      this.dialog = true;
    },
    removeCard(column, card) {
      this.$alert.yesno(`modules.${this.module_id}.card.delete_confirm`, (btn) => {
        if (btn == "yes") {
          const index = column.cards.findIndex((item) => item.id == card.id);
          if (index >= 0) {
            column.cards.splice(index, 1);
          }
        }
      });
    },
    saveCard({ type, payload }) {
      const column = this.board.columns.find(
        (item) => item.id == this.editingColumnId,
      );
      if (!column) {
        return;
      }

      if (this.editingCard) {
        const index = column.cards.findIndex(
          (item) => item.id == this.editingCard.id,
        );
        if (index >= 0) {
          column.cards.splice(index, 1, {
            ...this.editingCard,
            type,
            title: payload.title,
            subtitle: payload.subtitle || "",
            payload,
          });
        }
      } else {
        column.cards.push(this.$liturgy.newCard(type, payload));
      }
    },
    async onExportPdfConfirm(days) {
      const { generateLiturgyPdf } = await import("../pdf.js");
      const dayLabels = {};
      this.weekdays.forEach((day) => {
        dayLabels[day] = this.t(`weekdays.${day}`);
      });
      const doc = generateLiturgyPdf(
        days,
        this.liturgy,
        dayLabels,
        this.t("export.pdf_doc_title"),
      );
      doc.save(`liturgia-${new Date().toISOString().slice(0, 10)}.pdf`);
    },
    exportBackup() {
      const json = this.$liturgy.exportData(this.liturgy);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `liturgia-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    triggerImport() {
      this.$refs.importInput.click();
    },
    onImportFile(event) {
      const file = event.target.files[0];
      event.target.value = "";
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        let imported;
        try {
          imported = this.$liturgy.importData(reader.result);
        } catch (e) {
          this.$alert.error({
            text: `modules.${this.module_id}.export.import_error`,
            error: e,
          });
          return;
        }

        this.$alert.yesno(`modules.${this.module_id}.export.import_confirm`, (btn) => {
          if (btn == "yes") {
            this.liturgy = imported;
          }
        });
      };
      reader.onerror = () => {
        this.$alert.error({ text: `modules.${this.module_id}.export.import_error` });
      };
      reader.readAsText(file);
    },
  },
  created() {
    this.liturgy = this.$liturgy.load();
  },
};
</script>
