<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <template v-slot:header>
      <div class="d-flex align-center w-100">
        <v-spacer />
        <v-btn
          icon="mdi-download"
          variant="text"
          size="small"
          :title="t('export_tooltip')"
          @click="exportItems"
        />
        <v-btn
          icon="mdi-upload"
          variant="text"
          size="small"
          :title="t('import_tooltip')"
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

    <div class="d-flex align-stretch" style="height: 100%; overflow: hidden">
      <!-- Lista de recados -->
      <div
        v-if="!isMobile || !selectedId"
        :style="isMobile ? 'width:100%; overflow-y:auto' : 'width: 260px; min-width: 260px; overflow-y: auto'"
        class="border-e"
      >
        <v-list density="compact" nav>
          <v-list-item
            v-for="item in items"
            :key="item.id"
            :active="item.id == selectedId"
            link
            @click="selectedId = item.id"
          >
            <template v-slot:prepend>
              <v-avatar size="32" rounded="sm">
                <v-img v-if="item.image" :src="item.image" cover />
                <v-icon v-else icon="mdi-bullhorn-outline" size="18" />
              </v-avatar>
            </template>
            <v-list-item-title class="text-truncate">
              {{ item.title || t("untitled") }}
            </v-list-item-title>
            <template v-slot:append>
              <v-icon
                v-if="isPlaying(item)"
                icon="mdi-broadcast"
                color="error"
                size="16"
                class="me-1"
              />
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="x-small"
                @click.stop="removeItem(item)"
              />
            </template>
          </v-list-item>

          <v-list-item v-if="!items.length">
            <v-list-item-subtitle class="text-wrap">
              {{ t("no_announcements") }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-btn
          block
          variant="tonal"
          class="ma-2"
          prepend-icon="mdi-plus"
          @click="addItem"
        >
          {{ t("new_announcement") }}
        </v-btn>
      </div>

      <!-- Editor do recado selecionado -->
      <div v-if="!isMobile || selectedId" class="flex-grow-1 pa-4" style="overflow-y: auto">
        <template v-if="selectedItem">
          <v-btn
            v-if="isMobile"
            variant="text"
            prepend-icon="mdi-arrow-left"
            class="mb-2"
            @click="selectedId = null"
          >
            {{ t("title") }}
          </v-btn>
          <v-text-field
            v-model="selectedItem.title"
            :label="t('announcement_title')"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-3"
          />
          <v-textarea
            v-model="selectedItem.text"
            :label="t('announcement_text')"
            density="compact"
            variant="outlined"
            rows="4"
            auto-grow
            hide-details
            class="mb-3"
          />

          <div class="mb-3">
            <v-img
              v-if="selectedItem.image"
              :src="selectedItem.image"
              max-height="220"
              class="rounded mb-2"
              style="border: 1px solid rgba(128, 128, 128, 0.3)"
            />
            <div class="d-flex ga-2">
              <v-btn
                variant="outlined"
                size="small"
                prepend-icon="mdi-image-plus"
                @click="$refs.imageInput.click()"
              >
                {{ t("add_image") }}
              </v-btn>
              <v-btn
                v-if="selectedItem.image"
                variant="text"
                size="small"
                color="error"
                prepend-icon="mdi-image-remove"
                @click="selectedItem.image = ''"
              >
                {{ t("remove_image") }}
              </v-btn>
            </div>
            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              class="d-none"
              @change="onImageFile"
            />
          </div>

          <v-btn
            :color="isPlaying(selectedItem) ? 'error' : 'primary'"
            :prepend-icon="isPlaying(selectedItem) ? 'mdi-stop' : 'mdi-play'"
            variant="flat"
            @click="togglePlay(selectedItem)"
          >
            {{ isPlaying(selectedItem) ? t("stop") : t("play") }}
          </v-btn>
        </template>

        <div
          v-else
          class="d-flex align-center justify-center text-medium-emphasis"
          style="height: 100%"
        >
          {{ t("select_announcement") }}
        </div>
      </div>
    </div>
  </ModuleContainer>
</template>

<script>
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default {
  name: manifest.id,
  components: {
    ModuleContainer,
  },
  data: () => ({
    items: [],
    selectedId: null,
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
    selectedItem() {
      return this.items.find((item) => item.id == this.selectedId);
    },
    isMobile() {
      return this.$vuetify.display.width <= 600;
    },
  },
  watch: {
    items: {
      deep: true,
      handler() {
        this.$announcement.save(this.items);
      },
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    addItem() {
      const item = this.$announcement.newAnnouncement();
      this.items.push(item);
      this.selectedId = item.id;
    },
    removeItem(item) {
      this.$alert.yesno(`modules.${this.module_id}.delete_confirm`, (btn) => {
        if (btn == "yes") {
          const index = this.items.findIndex((i) => i.id == item.id);
          if (index >= 0) {
            this.items.splice(index, 1);
          }
          if (this.selectedId == item.id) {
            this.selectedId = null;
          }
        }
      });
    },
    isPlaying(item) {
      return this.$announcement.isPlaying(item);
    },
    togglePlay(item) {
      if (this.isPlaying(item)) {
        this.$popup.exit();
      } else {
        this.$announcement.play(item);
      }
    },
    onImageFile(event) {
      const file = event.target.files[0];
      event.target.value = "";
      if (!file || !this.selectedItem) {
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        this.$alert.error({ text: `modules.${this.module_id}.image_too_large` });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedItem.image = reader.result;
      };
      reader.readAsDataURL(file);
    },
    exportItems() {
      const json = this.$announcement.exportData(this.items);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recados-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
          imported = this.$announcement.importData(reader.result);
        } catch (e) {
          this.$alert.error({
            text: `modules.${this.module_id}.import_error`,
            error: e,
          });
          return;
        }

        this.$alert.yesno(`modules.${this.module_id}.import_confirm`, (btn) => {
          if (btn == "yes") {
            this.items = imported;
            this.selectedId = imported[0]?.id || null;
          }
        });
      };
      reader.onerror = () => {
        this.$alert.error({ text: `modules.${this.module_id}.import_error` });
      };
      reader.readAsText(file);
    },
  },
  created() {
    this.items = this.$announcement.load();
    if (this.items.length) {
      this.selectedId = this.items[0].id;
    }
  },
};
</script>
