<template>
  <div>
    <LSelect
      :label="t(`${type}.kind`)"
      v-model="kind"
      :items="kindOptions"
      item-value="value"
      item-title="title"
    />

    <v-text-field
      class="mt-2"
      v-model="url"
      :label="t(`${type}.url`)"
      density="compact"
      variant="outlined"
      hide-details
      prepend-inner-icon="mdi-link"
    />
  </div>
</template>

<script>
import LSelect from "@/components/inputs/Select.vue";

export default {
  name: "LiturgyMediaLinkPicker",
  components: {
    LSelect,
  },
  props: {
    modelValue: Object,
    type: {
      type: String,
      required: true, // "link" | "media"
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      kind: this.modelValue?.kind || (this.type == "link" ? "youtube" : "image"),
      url: this.modelValue?.url || "",
    };
  },
  computed: {
    kindOptions() {
      if (this.type == "link") {
        return [
          { value: "youtube", title: this.t("link.kind_youtube") },
          { value: "iframe", title: this.t("link.kind_iframe") },
        ];
      }
      return [
        { value: "image", title: this.t("media.kind_image") },
        { value: "video", title: this.t("media.kind_video") },
        { value: "audio", title: this.t("media.kind_audio") },
      ];
    },
  },
  watch: {
    kind() {
      this.emitValue();
    },
    url() {
      this.emitValue();
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.liturgy.${text}`);
    },
    emitValue() {
      if (!this.url) {
        this.$emit("update:modelValue", null);
        return;
      }
      this.$emit("update:modelValue", {
        title: this.url,
        subtitle: this.kind,
        kind: this.kind,
        url: this.url,
      });
    },
  },
  created() {
    this.emitValue();
  },
};
</script>
