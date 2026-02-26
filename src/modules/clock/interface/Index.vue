<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    

    <!-- Main Content - Two Columns -->
    <div class="clock-config-container">
      <!-- Settings Panel -->
      <div class="settings-panel">
        <div class="section-title">
          <span class="title-icon"></span>
          <span>{{ t('settings.title') }}</span>
        </div>

        <!-- Format -->
        <div class="setting-group">
          <label class="setting-label">{{ t('settings.format') }}</label>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="outlined"
                block
                class="format-selector"
              >
                {{ getSelectedFormatLabel() }}
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="format in formatOptions"
                :key="format.value"
                :active="config.format === format.value"
                @click="selectFormat(format.value)"
              >
                <v-list-item-title>{{ format.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <!-- Background -->
        <div class="setting-group">
          <label class="setting-label">{{ t('settings.background') }}</label>
          <div class="color-picker-row">
            <input type="color" v-model="config.background" class="color-input" @change="saveConfig" />
            <input type="text" v-model="config.background" class="hex-input" @change="saveConfig" />
          </div>
          <div class="color-presets">
            <button
              v-for="color in backgroundPresets"
              :key="color"
              :class="['color-preset', { active: config.background === color }]"
              :style="{ backgroundColor: color }"
              @click="selectBackground(color)"
            />
          </div>
        </div>

        <!-- Text Color -->
        <div class="setting-group">
          <label class="setting-label">{{ t('settings.textColor') }}</label>
          <div class="color-picker-row">
            <input type="color" v-model="config.textColor" class="color-input" @change="saveConfig" />
            <input type="text" v-model="config.textColor" class="hex-input" @change="saveConfig" />
          </div>
          <div class="color-presets">
            <button
              v-for="color in textColorPresets"
              :key="color"
              :class="['color-preset', { active: config.textColor === color }]"
              :style="{ backgroundColor: color }"
              @click="selectTextColor(color)"
            />
          </div>
        </div>

        <!-- Font Size -->
        <div class="setting-group">
          <label class="setting-label">Tamanho da Fonte</label>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="outlined"
                block
                class="format-selector"
              >
                {{ config.fontSize }}px
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="size in fontSizeOptions"
                :key="size"
                :active="config.fontSize === size"
                @click="selectFontSize(size)"
              >
                <v-list-item-title>{{ size }}px</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <!-- Font Family -->
        <div class="setting-group">
          <label class="setting-label">Fonte</label>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="outlined"
                block
                class="format-selector"
                :style="{ fontFamily: config.fontFamily }"
              >
                {{ getFontFamilyLabel() }}
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="font in fontFamilyOptions"
                :key="font.value"
                :active="config.fontFamily === font.value"
                @click="selectFontFamily(font.value)"
              >
                <v-list-item-title :style="{ fontFamily: font.value }">{{ font.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <!-- Botão de Projeção -->
        <div class="setting-group">
          <label class="setting-label">Projeção</label>
          <LScreenBtn module="clock" />
        </div>
      </div>

      <!-- Preview Panel -->
      <div class="preview-panel">
        <div class="section-title">
          <span>{{ t('settings.preview') }}</span>
        </div>
        <div
          class="clock-display"
          :style="{
            backgroundColor: config.background,
            color: config.textColor,
            fontSize: config.fontSize + 'px',
            fontFamily: config.fontFamily
          }"
        >
          <span class="clock-time">{{ formattedTime }}</span>
        </div>
        <div class="date-display">
          {{ formattedDate }}
        </div>
      </div>
    </div>
  </ModuleContainer>
</template>

<script>
import ModuleContainer from "@/layout/ModuleContainer.vue";
import LScreenBtn from "@/components/buttons/Screen.vue";
import { ref, computed, onMounted, onUnmounted } from "vue";

export default {
  name: "ClockInterface",
  components: {
    ModuleContainer,
    LScreenBtn,
  },
  data: () => ({
    config: {
      format: 'hh:mm',
      background: '#000000',
      textColor: '#ffffff',
      fontSize: 96,
      fontFamily: 'Arial, sans-serif',
    },
    formatOptions: [
      { label: '(hh:mm)', value: 'hh:mm' },
      { label: '(hh:mm:ss)', value: 'hh:mm:ss' },
      { label: '(hh)', value: 'hh' },
      { label: '(mm:ss)', value: 'mm:ss' },
      { label: '(mm:ss:SS)', value: 'mm:ss:SS' },
      { label: '(H:mm)', value: 'H:mm' },
      { label: '(H:mm:ss)', value: 'H:mm:ss' },
    ],
    fontSizeOptions: [48, 60, 72, 84, 96, 108, 120, 144, 168, 192],
    fontFamilyOptions: [
      { label: 'Arial', value: 'Arial, sans-serif' },
      { label: 'Helvetica', value: 'Helvetica, sans-serif' },
      { label: 'Times New Roman', value: 'Times New Roman, serif' },
      { label: 'Georgia', value: 'Georgia, serif' },
      { label: 'Courier New', value: 'Courier New, monospace' },
      { label: 'Verdana', value: 'Verdana, sans-serif' },
      { label: 'DIN Condensed', value: 'din-bold, sans-serif' },
    ],
    backgroundPresets: [ '#000000', '#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', ],
    textColorPresets: ['#000000', '#ffffff', '#1e293b', '#334155', '#64748b', '#cbd5e1','#ef4444', '#f59e0b'],
    currentTime: new Date(),
    timer: null,
  }),
  computed: {
    moduleContainer() {
      return this.$refs.moduleContainer;
    },
    formattedTime() {
      const format = this.config.format || 'hh:mm';
      const options = {};
      
      // Handle uppercase variants (H:mm, H:mm:ss)
      if (format.includes('H')) {
        options.hour = 'numeric';
      } else if (format.includes('hh') || format.includes('HH')) {
        options.hour = '2-digit';
      }
      
      if (format.includes('mm')) {
        options.minute = '2-digit';
      }
      if (format.includes('ss') && !format.includes('SS')) {
        options.second = '2-digit';
      }
      if (format.includes('SS')) {
        options.second = 'numeric';
      }
      
      return this.currentTime.toLocaleTimeString('pt-BR', options);
    },
    formattedDate() {
      return this.currentTime.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
  },
  methods: {
    t(key) {
      return this.moduleContainer?.t(key) || key;
    },
    selectFormat(value) {
      this.config.format = value;
      this.saveConfig();
    },
    getSelectedFormatLabel() {
      const format = this.formatOptions.find(f => f.value === this.config.format);
      return format ? format.label : 'Selecione';
    },
    getFontFamilyLabel() {
      const font = this.fontFamilyOptions.find(f => f.value === this.config.fontFamily);
      return font ? font.label : 'Selecione';
    },
    selectBackground(color) {
      this.config.background = color;
      this.saveConfig();
    },
    selectTextColor(color) {
      this.config.textColor = color;
      this.saveConfig();
    },
    selectFontSize(size) {
      this.config.fontSize = size;
      this.saveConfig();
    },
    selectFontFamily(family) {
      this.config.fontFamily = family;
      this.saveConfig();
    },
    saveConfig() {
      try {
        this.$appdata.set(`modules.clock.config`, JSON.parse(JSON.stringify(this.config)));
      } catch (e) {
        console.error('Error saving config:', e);
      }
    },
    loadConfig() {
      try {
        const savedConfig = this.$appdata.get(`modules.clock.config`);
        if (savedConfig) {
          this.config = { ...this.config, ...savedConfig };
        }
      } catch (e) {
        console.error('Error loading config:', e);
      }
    },
  },
  watch: {},
  mounted() {
    setTimeout(() => {
      this.loadConfig();
    }, 500);
    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
};
</script>

<style scoped>
.clock-config-container {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: #f3f4f6;
  min-height: 100%;
  flex-wrap: wrap;
}

.settings-panel {
  padding: 24px;
  background: white;
  width: 380px;
  flex-shrink: 0;
}

.preview-panel {
  padding: 24px;
  background: white;
  flex: 1;
  min-width: 400px;
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

.format-v-list {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.format-v-list .v-list-item {
  border-bottom: 1px solid #f3f4f6;
}

.format-v-list .v-list-item:last-child {
  border-bottom: none;
}

.format-selector {
  justify-content: flex-start;
  text-transform: none;
  font-weight: normal;
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
  border: 2px solid #474747;
  border-radius: 6px;
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

.clock-display {
  height: 250px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 96px;
  font-weight: 600;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.date-display {
  background: #f3f4f6;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  text-transform: capitalize;
}
</style>

<!-- ########################################################### -->
<!-- ####### SETUP OBRIGATÓRIA PARA INSTALAÇÃO DO MODULO ####### -->
<!-- ########################################################### -->
<script setup>
import manifest from "../manifest.json";
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};
</script>
<!-- ########################################################### -->
<!-- ########################################################### -->
<!-- ########################################################### -->
