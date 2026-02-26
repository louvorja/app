<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <template v-slot:header>
      <v-toolbar>
        <v-toolbar-title>
          <v-icon start color="red">mdi-youtube</v-icon>
          YouTube
        </v-toolbar-title>
        <v-spacer />
      </v-toolbar>
    </template>

    <v-container fluid>
      <v-row>
        <!-- Categorias / Playlists -->
        <v-col cols="12" md="3">
          <v-card class="mb-4">
            <v-card-title>
              <v-icon start>mdi-playlist-play</v-icon>
              {{ t('playlists') }}
            </v-card-title>
            <v-list>
              <v-list-item
                v-for="playlist in playlists"
                :key="playlist.id"
                :active="selectedPlaylist === playlist.id"
                @click="selectPlaylist(playlist.id)"
                link
              >
                <template v-slot:prepend>
                  <v-icon :color="playlist.color">{{ playlist.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ playlist.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Lista de vídeos / Player -->
        <v-col cols="12" md="9">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon start :color="selectedPlaylistData?.color || 'red'">
                {{ selectedPlaylistData?.icon || 'mdi-youtube' }}
              </v-icon>
              {{ selectedPlaylistTitle }}
              <v-spacer />
              <v-chip color="red" size="small">
                {{ t('videos') }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <!-- Player de Playlist do YouTube -->
              <div class="playlist-player-container">
                <iframe
                  :src="currentEmbedUrl"
                  class="playlist-player-iframe"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>
              
              <!-- Link para abrir no YouTube -->
              <div class="text-center mt-4">
                <v-btn
                  color="red"
                  variant="outlined"
                  :href="currentPlaylistUrl"
                  target="_blank"
                >
                  <v-icon start>mdi-open-in-new</v-icon>
                  {{ t('open_in_youtube') }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </ModuleContainer>
</template>

<script>
import playlistsConfig from "../config/playlists.json";

export default {
  name: "YouTubeIndex",
  data: () => ({
    playlists: playlistsConfig.playlists,
  }),
  computed: {
    selectedPlaylist: {
      get() {
        return this.$appdata.get("modules.youtube.selectedPlaylist") || "prova_e_vede_com_libras";
      },
      set(value) {
        this.$appdata.set("modules.youtube.selectedPlaylist", value);
      }
    },
    selectedPlaylistTitle() {
      const playlist = this.playlists.find(p => p.id === this.selectedPlaylist);
      return playlist ? playlist.name : this.t('all_videos');
    },
    selectedPlaylistData() {
      return this.playlists.find(p => p.id === this.selectedPlaylist);
    },
    currentEmbedUrl() {
      const playlist = this.selectedPlaylistData;
      if (!playlist) return "";
      
      if (playlist.type === "playlist" && playlist.playlistId) {
        return `https://www.youtube.com/embed/videoseries?list=${playlist.playlistId}`;
      } else if (playlist.type === "channel") {
        return `https://www.youtube.com/embed?listType=user_uploads&list=${playlist.url.split('@')[1]?.split('/')[0] || ''}`;
      }
      return "";
    },
    currentPlaylistUrl() {
      const playlist = this.selectedPlaylistData;
      if (!playlist) return "#";
      
      if (playlist.type === "playlist" && playlist.playlistId) {
        return `https://www.youtube.com/playlist?list=${playlist.playlistId}`;
      } else if (playlist.url) {
        return playlist.url;
      }
      return "#";
    },
  },
  mounted() {
    if (!this.$appdata.exists("modules.youtube.selectedPlaylist")) {
      this.$appdata.set("modules.youtube.selectedPlaylist", "prova_e_vede_com_libras");
    }
  },
  methods: {
    t(text) {
      return this.$t(`modules.youtube.${text}`);
    },
    selectPlaylist(playlistId) {
      this.selectedPlaylist = playlistId;
    },
  },
};
</script>

<!-- ########################################################### -->
<!-- ####### SETUP OBRIGATÓRIA PARA INSTALAÇÃO DO MODULO ####### -->
<!-- ########################################################### -->
<script setup>
import manifest from "../manifest.json";
import ModuleContainer from "@/layout/ModuleContainer.vue";
import { ref } from "vue";
const moduleContainer = ref(null);
</script>
<!-- ########################################################### -->
<!-- ########################################################### -->
<!-- ########################################################### -->

<style scoped>
.playlist-player-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.playlist-player-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
