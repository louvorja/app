<template>
  <div class="lp">
    <button
      type="button"
      class="lp-btn lp-btn--all"
      :class="{ 'lp-btn--active': input < 0 }"
      @click="reset"
    >
      {{ $t("components.letterpagination.all") }}
    </button>

    <div class="lp-letters">
      <button
        v-for="(letter, idx) in letters"
        :key="letter"
        type="button"
        class="lp-btn"
        :class="{ 'lp-btn--active': input === idx }"
        @click="toggle(idx)"
      >
        {{ letter }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const LETTERS = [
  "#",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const props = defineProps({
  modelValue: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const letters = computed(() => LETTERS);

const input = computed({
  get: () => letters.value.indexOf(props.modelValue),
  set: (v) => emit("update:modelValue", letters.value[v] ?? ""),
});

function toggle(idx) {
  emit("update:modelValue", input.value === idx ? "" : letters.value[idx]);
}

function reset() {
  emit("update:modelValue", "");
}
</script>

<style scoped>
.lp {
  display: flex;
  align-items: center;
  gap: var(--lj-space-2);
  width: 100%;
  font-family: var(--lj-font-shell);
}

.lp-letters {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 2px 0;
}

.lp-letters::-webkit-scrollbar {
  display: none;
}

.lp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  min-width: 26px;
  padding: 0 var(--lj-space-2);
  background: var(--lj-surface-bg-soft);
  border: 1px solid var(--lj-surface-border);
  border-radius: var(--lj-radius-sm);
  font-size: var(--lj-text-base);
  font-weight: var(--lj-weight-medium);
  color: var(--lj-text-muted);
  cursor: pointer;
  outline: none;
  transition:
    background var(--lj-transition-fast),
    color var(--lj-transition-fast),
    border-color var(--lj-transition-fast);
  flex-shrink: 0;
  font-family: inherit;
}

.lp-btn:hover {
  background: var(--lj-surface-bg-hover);
  color: var(--lj-text);
  border-color: var(--lj-surface-border-strong);
}

.lp-btn--active {
  background: var(--lj-navy);
  color: var(--lj-white);
  border-color: var(--lj-navy-dark);
  font-weight: var(--lj-weight-semibold);
}

.lp-btn--all {
  padding: 0 var(--lj-space-3);
  font-size: var(--lj-text-sm);
}
</style>
