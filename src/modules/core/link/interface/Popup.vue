<template>
  <div class="w-100 h-100 d-flex align-center justify-center" style="background: #000">
    <iframe
      v-if="kind == 'youtube' || kind == 'iframe'"
      :src="embedUrl"
      class="w-100 h-100"
      style="border: 0"
      allow="autoplay; fullscreen; encrypted-media"
      allowfullscreen
    />
    <img
      v-else-if="kind == 'image'"
      :src="url"
      class="w-100 h-100"
      style="object-fit: contain"
    />
    <video
      v-else-if="kind == 'video'"
      :src="url"
      class="w-100 h-100"
      style="object-fit: contain"
      autoplay
      controls
    />
    <audio v-else-if="kind == 'audio'" :src="url" autoplay controls />
  </div>
</template>

<script>
import manifest from "../manifest.json";

export default {
  name: "PopupLinkPage",
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

    data() {
      return this.$appdata.get("modules.link.data") || {};
    },
    kind() {
      return this.data.kind;
    },
    url() {
      return this.data.url;
    },
    embedUrl() {
      if (this.kind == "iframe") {
        return this.url;
      }
      if (this.kind == "youtube") {
        return this.toYoutubeEmbed(this.url);
      }
      return "";
    },
  },
  methods: {
    toYoutubeEmbed(url) {
      if (!url) {
        return "";
      }

      let id = null;
      try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("youtu.be")) {
          id = parsed.pathname.replace("/", "");
        } else if (parsed.pathname.startsWith("/embed/")) {
          return url;
        } else {
          id = parsed.searchParams.get("v");
        }
      } catch {
        return "";
      }

      if (!id) {
        return "";
      }

      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    },
  },
};
</script>
