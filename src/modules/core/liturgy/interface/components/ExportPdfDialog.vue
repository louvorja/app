<template>
  <v-dialog v-model="show" max-width="420">
    <v-card>
      <v-card-title>{{ t("export.pdf_title") }}</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-2">{{ t("export.pdf_description") }}</p>
        <v-checkbox
          v-for="day in weekdays"
          :key="day"
          v-model="selected"
          :label="t(`weekdays.${day}`)"
          :value="day"
          density="compact"
          hide-details
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="show = false">{{ t("actions.cancel") }}</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!selected.length"
          @click="confirm"
        >
          {{ t("export.download_pdf") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { WEEKDAYS } from "@/helpers/Liturgy";

export default {
  name: "LiturgyExportPdfDialog",
  props: {
    modelValue: Boolean,
    activeDay: String,
  },
  emits: ["update:modelValue", "confirm"],
  data: () => ({
    weekdays: WEEKDAYS,
    selected: [],
  }),
  computed: {
    show: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  watch: {
    show(value) {
      if (value) {
        this.selected = this.activeDay ? [this.activeDay] : [];
      }
    },
  },
  methods: {
    t(text) {
      return this.$t(`modules.liturgy.${text}`);
    },
    confirm() {
      // Mantém a ordem oficial dos dias da semana, não a ordem em que foram marcados
      const ordered = this.weekdays.filter((day) => this.selected.includes(day));
      this.$emit("confirm", ordered);
      this.show = false;
    },
  },
};
</script>
