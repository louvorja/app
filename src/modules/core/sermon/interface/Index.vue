<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <div class="d-flex align-stretch" style="height: 100%; overflow: hidden">
      <!-- Lista de sermões -->
      <div
        v-if="!isMobile || !selectedId"
        :style="isMobile ? 'width:100%; overflow-y:auto' : 'width: 260px; min-width: 260px; overflow-y: auto'"
        class="border-e"
      >
        <v-list density="compact" nav>
          <v-list-item
            v-for="sermon in sermons"
            :key="sermon.id"
            :active="sermon.id == selectedId"
            link
            @click="selectedId = sermon.id"
          >
            <v-list-item-title class="text-truncate">
              {{ sermon.title || t("new_sermon") }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ sermon.date }}</v-list-item-subtitle>
            <template v-slot:append>
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="x-small"
                @click.stop="removeSermon(sermon)"
              />
            </template>
          </v-list-item>

          <v-list-item v-if="!sermons.length">
            <v-list-item-subtitle class="text-wrap">
              {{ t("no_sermons") }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-btn
          block
          variant="tonal"
          class="ma-2"
          prepend-icon="mdi-plus"
          @click="addSermon"
        >
          {{ t("new_sermon") }}
        </v-btn>
      </div>

      <!-- Editor do sermão selecionado -->
      <div v-if="!isMobile || selectedId" class="flex-grow-1 pa-4" style="overflow-y: auto">
        <template v-if="selectedSermon">
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
            v-model="selectedSermon.title"
            :label="t('sermon_title')"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-4"
          />

          <draggable
            v-model="selectedSermon.points"
            item-key="id"
            handle=".sermon-point-handle"
            :delay="200"
            delay-on-touch-only
            :touch-start-threshold="5"
          >
            <template #item="{ element: point }">
              <v-card class="mb-3" variant="outlined">
                <v-card-text class="d-flex align-start pa-3">
                  <v-icon
                    icon="mdi-drag-vertical"
                    class="sermon-point-handle mt-2 me-2"
                    style="cursor: move"
                  />
                  <div class="flex-grow-1">
                    <v-text-field
                      v-model="point.title"
                      :label="t('point.title')"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="mb-2"
                    />
                    <v-textarea
                      v-model="point.text"
                      :label="t('point.text')"
                      density="compact"
                      variant="outlined"
                      hide-details
                      rows="2"
                      auto-grow
                    />
                  </div>
                  <div class="d-flex flex-column ms-2">
                    <v-btn
                      :icon="isPlaying(point) ? 'mdi-stop' : 'mdi-play'"
                      :color="isPlaying(point) ? 'error' : 'primary'"
                      :title="isPlaying(point) ? t('point.stop') : t('point.play')"
                      variant="text"
                      size="small"
                      @click="togglePlay(point)"
                    />
                    <v-btn
                      icon="mdi-close"
                      :title="t('point.delete')"
                      variant="text"
                      size="small"
                      @click="removePoint(point)"
                    />
                  </div>
                </v-card-text>
              </v-card>
            </template>
          </draggable>

          <div
            v-if="!selectedSermon.points.length"
            class="text-caption text-medium-emphasis text-center pa-4"
          >
            {{ t("no_points") }}
          </div>

          <v-btn
            block
            variant="text"
            prepend-icon="mdi-plus"
            @click="addPoint"
          >
            {{ t("point.add") }}
          </v-btn>
        </template>

        <div
          v-else
          class="d-flex align-center justify-center text-medium-emphasis"
          style="height: 100%"
        >
          {{ t("select_sermon") }}
        </div>
      </div>
    </div>
  </ModuleContainer>
</template>

<script>
import draggable from "vuedraggable";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";

export default {
  name: manifest.id,
  components: {
    ModuleContainer,
    draggable,
  },
  data: () => ({
    sermons: [],
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
    selectedSermon() {
      return this.sermons.find((sermon) => sermon.id == this.selectedId);
    },
    isMobile() {
      return this.$vuetify.display.width <= 600;
    },
  },
  watch: {
    sermons: {
      deep: true,
      handler() {
        this.$sermon.save(this.sermons);
      },
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    addSermon() {
      const sermon = this.$sermon.newSermon(this.t("new_sermon"));
      this.sermons.push(sermon);
      this.selectedId = sermon.id;
    },
    removeSermon(sermon) {
      this.$alert.yesno(`modules.${this.module_id}.delete_sermon_confirm`, (btn) => {
        if (btn == "yes") {
          const index = this.sermons.findIndex((item) => item.id == sermon.id);
          if (index >= 0) {
            this.sermons.splice(index, 1);
          }
          if (this.selectedId == sermon.id) {
            this.selectedId = null;
          }
        }
      });
    },
    addPoint() {
      this.selectedSermon.points.push(this.$sermon.newPoint());
    },
    removePoint(point) {
      this.$alert.yesno(`modules.${this.module_id}.point.delete_confirm`, (btn) => {
        if (btn == "yes") {
          const index = this.selectedSermon.points.findIndex(
            (item) => item.id == point.id,
          );
          if (index >= 0) {
            this.selectedSermon.points.splice(index, 1);
          }
        }
      });
    },
    isPlaying(point) {
      return this.$sermon.isPlaying(point);
    },
    togglePlay(point) {
      if (this.isPlaying(point)) {
        this.$popup.exit();
      } else {
        this.$sermon.play(this.selectedSermon, point);
      }
    },
  },
  created() {
    this.sermons = this.$sermon.load();
    if (this.sermons.length) {
      this.selectedId = this.sermons[0].id;
    }
  },
};
</script>
