<template>
  <div>
    <LSelect
      :label="t('sermon.sermon')"
      v-model="sermonId"
      :items="sermonOptions"
      item-value="value"
      item-title="title"
    />

    <LSelect
      v-if="sermonId"
      class="mt-2"
      :label="t('sermon.point')"
      v-model="pointId"
      :items="pointOptions"
      item-value="value"
      item-title="title"
    />

    <v-alert
      v-if="!sermonId || !pointId"
      type="info"
      variant="tonal"
      density="compact"
      class="mt-2"
      :text="t('sermon.not_selected')"
    />
    <v-sheet v-else class="pa-2 mt-2" border rounded>
      <div class="text-body-2 font-weight-medium">{{ selectedPoint?.title }}</div>
      <div class="text-caption text-medium-emphasis mt-1">
        {{ selectedPoint?.text }}
      </div>
    </v-sheet>
  </div>
</template>

<script>
import LSelect from "@/components/inputs/Select.vue";

export default {
  name: "LiturgySermonPicker",
  components: {
    LSelect,
  },
  props: {
    modelValue: Object,
  },
  emits: ["update:modelValue"],
  data: () => ({
    sermons: [],
    sermonId: null,
    pointId: null,
  }),
  computed: {
    sermonOptions() {
      return this.sermons.map((sermon) => ({
        value: sermon.id,
        title: sermon.title || this.$t("modules.sermon.new_sermon"),
      }));
    },
    selectedSermon() {
      return this.sermons.find((sermon) => sermon.id == this.sermonId);
    },
    pointOptions() {
      return (this.selectedSermon?.points || []).map((point) => ({
        value: point.id,
        title: point.title || this.$t("modules.sermon.point.title"),
      }));
    },
    selectedPoint() {
      return this.selectedSermon?.points?.find((point) => point.id == this.pointId);
    },
  },
  watch: {
    sermonId() {
      this.pointId = this.selectedSermon?.points?.[0]?.id || null;
      this.emitValue();
    },
    pointId() {
      this.emitValue();
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.liturgy.${text}`);
    },
    emitValue() {
      if (!this.selectedSermon || !this.selectedPoint) {
        this.$emit("update:modelValue", null);
        return;
      }
      this.$emit("update:modelValue", {
        title: this.selectedPoint.title,
        subtitle: this.selectedSermon.title,
        text: this.selectedPoint.text,
        sermon_title: this.selectedSermon.title,
      });
    },
  },
  created() {
    this.sermons = this.$sermon.load();
    if (this.modelValue) {
      const sermon = this.sermons.find((s) => s.title == this.modelValue.subtitle);
      if (sermon) {
        this.sermonId = sermon.id;
        const point = sermon.points.find((p) => p.title == this.modelValue.title);
        if (point) {
          this.pointId = point.id;
        }
      }
    } else if (this.sermons.length) {
      this.sermonId = this.sermons[0].id;
    }
  },
};
</script>
