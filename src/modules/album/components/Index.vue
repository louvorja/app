<template>
  <Window
    v-model="module.show"
    :title="module?.data?.name"
    :image="module?.data?.url_image ? $path.file(module.data.url_image) : ''"
    closable
    compact
    title-class="text-h4 font-weight-light"
    :image-size="125"
    :color="module?.data?.color"
    slot-left-class="w-100"
    @close="album.close()"
  >
    <template #left>
      <v-table
        v-if="!album.loading"
        fixed-header
        hover
        class="w-100 h-100"
        :style="{ backgroundColor: module.data.color, color: '#FFF' }"
      >
        <thead>
          <tr>
            <th class="text-right" :style="{ backgroundColor: module.data.color, color: '#FFF' }">
              {{ t("table.track") }}
            </th>
            <th class="text-left" :style="{ backgroundColor: module.data.color, color: '#FFF' }">
              {{ t("table.music_name") }}
            </th>
            <th class="text-right" :style="{ backgroundColor: module.data.color, color: '#FFF' }">
              {{ t("table.duration") }}
            </th>
            <th :style="{ backgroundColor: module.data.color, color: '#FFF' }" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in module.data.musics" :key="item.id_music">
            <td class="text-right">
              {{ item.track }}
            </td>
            <td>{{ item.name }}</td>
            <td class="text-right">{{ $datetime.shortTime(item.duration) }}</td>
            <td>
              <div class="d-flex justify-end">
                <MusicMenuTable
                  color="#FFF"
                  :id_music="item.id_music"
                  :name="item.name"
                  :has_instrumental_music="item.has_instrumental_music"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-progress-linear v-if="album.loading" color="white" indeterminate />
    </template>
  </Window>
</template>

<script setup>
import manifest from "../manifest.json";

import { useModule } from "@/composables/useModule";
import { useAlbum } from "@/composables/useAlbum";
import Window from "@/components/Window.vue";
import MusicMenuTable from "@/components/MusicMenuTable.vue";

const { module, t, $path, $datetime } = useModule(manifest);
const album = useAlbum();
</script>
