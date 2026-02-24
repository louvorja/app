<template>
  <div class="settings-panel">
    <!-- Título -->
    <div class="section-title">
      <span class="title-icon"></span>
      <span>{{ $t('modules.clock.settings.title') }}</span>
    </div>

    <!-- Formato do Relógio -->
    <div class="setting-group">
      <label class="setting-label">{{ $t('modules.clock.settings.format') }}</label>
      <div class="toggle-buttons">
        <button
          v-for="option in formatOptions"
          :key="option.value"
          :class="['toggle-btn', { active: modelValue.format === option.value }]"
          @click="updateFormat(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Cor de Fundo -->
    <div class="setting-group">
      <label class="setting-label">{{ $t('modules.clock.settings.background') }}</label>
      <div class="color-picker-row">
        <input
          type="color"
          :value="modelValue.background"
          @input="updateBackground($event.target.value)"
          class="color-input"
        />
        <input
          type="text"
          :value="modelValue.background"
          @input="updateBackground($event.target.value)"
          class="hex-input"
        />
      </div>
      <div class="color-presets">
        <button
          v-for="color in backgroundPresets"
          :key="color"
          :class="['color-preset', { active: modelValue.background === color }]"
          :style="{ backgroundColor: color }"
          @click="updateBackground(color)"
        />
      </div>
    </div>

    <!-- Cor do Texto -->
    <div class="setting-group">
      <label class="setting-label">{{ $t('modules.clock.settings.textColor') }}</label>
      <div class="color-picker-row">
        <input
          type="color"
          :value="modelValue.textColor"
          @input="updateTextColor($event.target.value)"
          class="color-input"
        />
        <input
          type="text"
          :value="modelValue.textColor"
          @input="updateTextColor($event.target.value)"
          class="hex-input"
        />
      </div>
      <div class="color-presets">
        <button
          v-for="color in textColorPresets"
          :key="color"
          :class="['color-preset', { active: modelValue.textColor === color }]"
          :style="{ backgroundColor: color }"
          @click="updateTextColor(color)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const formatOptions = [
  { label: 'hh:mm', value: 'hh:mm' },
  { label: 'hh:mm:ss', value: 'hh:mm:ss' },
];

const backgroundPresets = [
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#000000',
];

const textColorPresets = [
  '#000000',
  '#ffffff',
  '#1e293b',
  '#334155',
  '#64748b',
  '#cbd5e1',
];

const updateFormat = (value) => {
  emit('update:modelValue', { ...props.modelValue, format: value });
};

const updateBackground = (value) => {
  emit('update:modelValue', { ...props.modelValue, background: value });
};

const updateTextColor = (value) => {
  emit('update:modelValue', { ...props.modelValue, textColor: value });
};
</script>

<style scoped>
.settings-panel {
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 380px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.title-icon {
  font-size: 24px;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.toggle-buttons {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f3f4f6;
  color: #374151;
}

.toggle-btn:hover {
  background: #e5e7eb;
}

.toggle-btn.active {
  background: #2563eb;
  color: white;
}

.color-picker-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.color-input {
  width: 60px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
}

.hex-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  text-transform: uppercase;
}

.hex-input:focus {
  outline: none;
  border-color: #2563eb;
}

.color-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-preset {
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3);
}
</style>
