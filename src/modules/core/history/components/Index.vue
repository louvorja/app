<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest" @close="close()">
    <template #right>
      <v-btn
        v-if="history.length"
        icon="mdi-delete-outline"
        variant="text"
        density="compact"
        :title="t('actions.clear')"
        @click="clearHistory()"
      />
    </template>

    <div v-if="history.length === 0" class="pa-6 text-center">
      <v-icon icon="mdi-history" size="64" class="mb-4 text-disabled" />
      <div class="text-body-1 mb-2">{{ t("data.empty") }}</div>
      <div class="text-body-2 text-disabled">{{ t("data.empty_hint") }}</div>
    </div>

    <v-list v-else density="compact">
      <v-list-item
        v-for="item in history"
        :key="item.id_music"
        :title="item.name"
        :subtitle="relativeDate(item.opened_at)"
        class="border-b"
      >
        <template #append>
          <MusicMenuTable
            :id_music="item.id_music"
            :name="item.name"
            :has_instrumental_music="item.has_instrumental_music"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            size="small"
            color="error"
            :title="t('actions.remove')"
            @click.stop="removeFromHistory(item.id_music)"
          />
        </template>
      </v-list-item>
    </v-list>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import MusicMenuTable from "@/components/MusicMenuTable.vue";
import AppData from "@/helpers/AppData";
import History from "@/helpers/History";

const moduleContainer = ref(null);

const history = computed(() => AppData.get("user_data.history", []));

const t = (key) => moduleContainer.value?.t(key) || key;

function relativeDate(ts) {
  if (!ts) return "";
  const now = Date.now();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return t("time.now");
  if (diff < 3600) return t("time.minutes").replace("{n}", Math.floor(diff / 60));
  if (diff < 86400) return t("time.hours").replace("{n}", Math.floor(diff / 3600));
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return t("time.yesterday");
  const sameYear = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString(
    [],
    sameYear
      ? { day: "2-digit", month: "short" }
      : { day: "2-digit", month: "2-digit", year: "2-digit" }
  );
}

function clearHistory() {
  History.clear();
}

function removeFromHistory(id) {
  History.remove(id);
}

function close() {}
</script>
