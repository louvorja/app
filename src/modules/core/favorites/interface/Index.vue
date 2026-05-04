<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest" @close="close()">
    <div v-if="favorites.length === 0" class="pa-6 text-center">
      <v-icon icon="mdi-star-off-outline" size="64" class="mb-4 text-disabled" />
      <div class="text-body-1 mb-2">{{ t("data.empty") }}</div>
      <div class="text-body-2 text-disabled">{{ t("data.empty_hint") }}</div>
    </div>

    <draggable v-else v-model="favorites" item-key="id_music" handle=".drag-handle">
      <template #item="{ element }">
        <v-list-item :title="element.name" class="border-b" density="compact">
          <template #prepend>
            <v-icon
              class="drag-handle cursor-grab mr-2"
              icon="mdi-drag-vertical"
              size="small"
              color="grey"
            />
          </template>
          <template #append>
            <MusicMenuTable
              :id_music="element.id_music"
              :name="element.name"
              :has_instrumental_music="element.has_instrumental_music"
              :extra-menu="extraMenu(element)"
            />
          </template>
        </v-list-item>
      </template>
    </draggable>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed } from "vue";
import draggable from "vuedraggable";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import MusicMenuTable from "@/components/MusicMenuTable.vue";
import AppData from "@/helpers/AppData";
import Favorites from "@/helpers/Favorites";

const moduleContainer = ref(null);

const favorites = computed({
  get: () => AppData.get("user_data.favorites", []),
  set: (val) => Favorites.reorder(val),
});

const t = (key) => moduleContainer.value?.t(key) || key;

function extraMenu(item) {
  return [
    {
      title: t("actions.remove"),
      icon: "mdi-star-off",
      click: () => Favorites.remove(item.id_music),
    },
  ];
}

function close() {}
</script>
