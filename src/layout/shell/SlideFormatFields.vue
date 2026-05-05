<template>
  <div class="slide-fields">
    <!-- Capa (cover) -->
    <fieldset class="slide-fieldset">
      <legend>{{ $t("formatacao.section.cover") }}</legend>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.color") }}</label>
        <input v-model="value.color_cover" type="color" class="slide-color" />
      </div>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.size") }}</label>
        <v-number-input
          v-model.number="value.font_size_cover"
          :min="1"
          :max="90"
          density="compact"
          variant="outlined"
          control-variant="split"
          hide-details
          style="max-width: 160px"
        />
      </div>
    </fieldset>

    <!-- Letra -->
    <fieldset class="slide-fieldset">
      <legend>{{ $t("formatacao.section.lyric") }}</legend>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.color") }}</label>
        <input v-model="value.color_lyric" type="color" class="slide-color" />
      </div>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.size") }}</label>
        <v-number-input
          v-model.number="value.font_size_lyric"
          :min="1"
          :max="90"
          density="compact"
          variant="outlined"
          control-variant="split"
          hide-details
          style="max-width: 160px"
        />
      </div>
    </fieldset>

    <!-- Próximo slide (Return) -->
    <fieldset class="slide-fieldset">
      <legend>{{ $t("formatacao.section.next") }}</legend>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.color") }}</label>
        <input v-model="value.color_next" type="color" class="slide-color" />
      </div>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.size") }}</label>
        <v-number-input
          v-model.number="value.font_size_next"
          :min="1"
          :max="60"
          density="compact"
          variant="outlined"
          control-variant="split"
          hide-details
          style="max-width: 160px"
        />
      </div>
    </fieldset>

    <!-- Fonte e fundo -->
    <fieldset class="slide-fieldset">
      <legend>{{ $t("formatacao.section.font_bg") }}</legend>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.font") }}</label>
        <v-select
          v-model="value.font"
          :items="fonts"
          item-title="label"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 260px"
        />
      </div>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.bg_color") }}</label>
        <input v-model="value.background_color" type="color" class="slide-color" />
      </div>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.progress_color") }}</label>
        <input v-model="value.progress_color" type="color" class="slide-color" />
      </div>
    </fieldset>

    <!-- Comportamento -->
    <fieldset class="slide-fieldset">
      <legend>{{ $t("formatacao.section.behavior") }}</legend>
      <div class="slide-row">
        <label>
          <input v-model="value.show_progress_bar" type="checkbox" />
          {{ $t("formatacao.field.show_progress") }}
        </label>
      </div>
      <div class="slide-row">
        <label>
          <input v-model="value.show_title_first_slide" type="checkbox" />
          {{ $t("formatacao.field.show_title_first_slide") }}
        </label>
      </div>
      <div class="slide-row">
        <label>{{ $t("formatacao.field.text_align") }}</label>
        <select v-model="value.text_align" class="slide-select">
          <option value="top">{{ $t("formatacao.field.align_top") }}</option>
          <option value="center">{{ $t("formatacao.field.align_center") }}</option>
          <option value="bottom">{{ $t("formatacao.field.align_bottom") }}</option>
        </select>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
import { computed } from "vue";
import $userdata from "@/helpers/UserData";
import { SLIDE_DEFAULTS } from "@/composables/useSlideStyle";

const fonts = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "Courier New, monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "DIN Condensed", value: "DINCondensedBold, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
];

// Proxy reativo de userdata.options.slides — set escreve direto no userdata.
const value = computed(() => {
  const stored = $userdata.get("options.slides", {}) || {};
  return new Proxy(
    {},
    {
      get: (_, key) => {
        const k = String(key);
        return stored[k] !== undefined ? stored[k] : SLIDE_DEFAULTS[k];
      },
      set: (_, key, val) => {
        const merged = { ...SLIDE_DEFAULTS, ...stored, [String(key)]: val };
        $userdata.set("options.slides", merged);
        return true;
      },
    }
  );
});
</script>

<style scoped>
.slide-fields {
  display: flex;
  flex-direction: column;
  gap: var(--lj-space-4);
}

.slide-fieldset {
  border: 1px solid var(--lj-surface-border);
  border-radius: var(--lj-radius-md);
  padding: var(--lj-space-3) var(--lj-space-4);
  background: var(--lj-surface-bg);
}

.slide-fieldset legend {
  font-weight: var(--lj-weight-semibold);
  padding: 0 var(--lj-space-2);
  font-size: var(--lj-text-sm);
  color: var(--lj-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.slide-row {
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  margin: var(--lj-space-2) 0;
}

.slide-row label {
  flex: 0 0 200px;
  color: var(--lj-text-muted);
}

.slide-color {
  width: 60px;
  height: 30px;
  border: 1px solid var(--lj-surface-border-strong);
  border-radius: var(--lj-radius-sm);
  cursor: pointer;
  background: var(--lj-surface-bg);
  padding: 2px;
}

.slide-select {
  background: var(--lj-surface-bg);
  border: 1px solid var(--lj-surface-border-strong);
  border-radius: var(--lj-radius-sm);
  padding: var(--lj-space-2) var(--lj-space-3);
  font-family: inherit;
  color: var(--lj-text);
  min-width: 160px;
}
</style>
