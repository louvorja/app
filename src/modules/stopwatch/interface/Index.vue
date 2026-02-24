<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    

    <!-- Main Content - Two Columns -->
    <div class="stopwatch-config-container">
      <!-- Settings Panel with Tabs -->
      <div class="settings-panel">
        <div class="section-title">
          <span class="title-icon"></span>
          <span>{{ t('settings.title') }}</span>
        </div>

        <!-- Tabs -->
        <v-tabs v-model="activeTab" color="primary" class="settings-tabs">
          <v-tab value="time">{{ t('settings.tabTime') }}</v-tab>
          <v-tab value="visual">{{ t('settings.tabVisual') }}</v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="tab-content">
          <!-- Time Settings Tab -->
          <v-window-item value="time">
            <!-- Mode -->
            <div class="setting-group">
              <label class="setting-label">{{ t('settings.mode') }}</label>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    variant="outlined"
                    block
                    class="format-selector"
                  >
                    {{ getModeLabel() }}
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-for="mode in modeOptions"
                    :key="mode.value"
                    :active="config.mode === mode.value"
                    @click="selectMode(mode.value)"
                  >
                    <v-list-item-title>{{ mode.label }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <!-- Show Current Time Toggle -->
            <div class="setting-group">
              <label class="setting-label">{{ t('settings.showCurrentTime') }}</label>
              <v-switch
                v-model="config.showCurrentTime"
                :label="config.showCurrentTime ? 'Sim' : 'Não'"
                color="primary"
                hide-details
                @change="saveConfig"
              />
            </div>

            <!-- Countdown Time Settings (for countdown mode) -->
            <div v-if="config.mode === 'countdown'" class="setting-group">
              <label class="setting-label">{{ t('settings.setTime') }}</label>
              <div class="time-inputs">
                <div class="time-input-group">
                  <label>{{ t('settings.hours') }}</label>
                  <input type="number" v-model.number="config.countdownHours" min="0" max="23" class="time-input" @change="saveConfig" />
                </div>
                <div class="time-input-group">
                  <label>{{ t('settings.minutes') }}</label>
                  <input type="number" v-model.number="config.countdownMinutes" min="0" max="59" class="time-input" @change="saveConfig" />
                </div>
                <div class="time-input-group">
                  <label>{{ t('settings.seconds') }}</label>
                  <input type="number" v-model.number="config.countdownSeconds" min="0" max="59" class="time-input" @change="saveConfig" />
                </div>
              </div>
              
              <!-- Continue after zero toggle -->
              <v-switch
                v-model="config.continueAfterZero"
                :label="t('settings.continueAfterZero')"
                color="warning"
                hide-details
                class="mt-3"
                @change="saveConfig"
              />
            </div>

            <!-- Target Time Settings (for countup mode) -->
            <div v-if="config.mode === 'countup'" class="setting-group">
              <label class="setting-label">{{ t('settings.targetTime') }}</label>
              <div class="time-inputs">
                <div class="time-input-group">
                  <label>{{ t('settings.hours') }}</label>
                  <input type="number" v-model.number="config.targetHours" min="0" max="23" class="time-input" @change="saveConfig" />
                </div>
                <div class="time-input-group">
                  <label>{{ t('settings.minutes') }}</label>
                  <input type="number" v-model.number="config.targetMinutes" min="0" max="59" class="time-input" @change="saveConfig" />
                </div>
                <div class="time-input-group">
                  <label>{{ t('settings.seconds') }}</label>
                  <input type="number" v-model.number="config.targetSeconds" min="0" max="59" class="time-input" @change="saveConfig" />
                </div>
              </div>
              <v-checkbox
                v-model="config.stopAtTarget"
                :label="t('settings.stopAtTarget')"
                density="compact"
                hide-details
                @change="saveConfig"
              />
            </div>
          </v-window-item>

          <!-- Visual Settings Tab -->
          <v-window-item value="visual">
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

            <!-- Timer Text Color -->
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

            <!-- Negative Color -->
            <div class="setting-group">
              <label class="setting-label">{{ t('settings.negativeColor') }}</label>
              <div class="color-picker-row">
                <input type="color" v-model="config.negativeColor" class="color-input" @change="saveConfig" />
                <input type="text" v-model="config.negativeColor" class="hex-input" @change="saveConfig" />
              </div>
            </div>

            <!-- Current Time Color -->
            <div class="setting-group">
              <label class="setting-label">{{ t('settings.currentTimeColor') }}</label>
              <div class="color-picker-row">
                <input type="color" v-model="config.currentTimeColor" class="color-input" @change="saveConfig" />
                <input type="text" v-model="config.currentTimeColor" class="hex-input" @change="saveConfig" />
              </div>
              <div class="color-presets">
                <button
                  v-for="color in textColorPresets"
                  :key="color"
                  :class="['color-preset', { active: config.currentTimeColor === color }]"
                  :style="{ backgroundColor: color }"
                  @click="selectCurrentTimeColor(color)"
                />
              </div>
            </div>

            <!-- Current Time Font Size -->
            <div class="setting-group">
              <label class="setting-label">{{ t('settings.currentTimeFontSize') }}</label>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    variant="outlined"
                    block
                    class="format-selector"
                  >
                    {{ config.currentTimeFontSize }}px
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-for="size in fontSizeOptionsSmall"
                    :key="size"
                    :active="config.currentTimeFontSize === size"
                    @click="selectCurrentTimeFontSize(size)"
                  >
                    <v-list-item-title>{{ size }}px</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <!-- Timer Font Size -->
            <div class="setting-group">
              <label class="setting-label">{{ t('settings.fontSize') }}</label>
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
              <label class="setting-label">{{ t('settings.fontFamily') }}</label>
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
          </v-window-item>
        </v-window>

        <!-- Botão de Projeção -->
        <div class="setting-group projection-btn">
          <label class="setting-label">Projeção</label>
          <LScreenBtn module="stopwatch" />
        </div>
      </div>

      <!-- Preview Panel -->
      <div class="preview-panel">
        <div class="section-title">
          <span>{{ t('settings.preview') }}</span>
        </div>
        
        <!-- Current Time Display -->
        <div v-if="config.showCurrentTime" class="current-time-display" :style="{ color: config.currentTimeColor, fontSize: config.currentTimeFontSize + 'px' }">
          {{ formattedCurrentTime }}
        </div>
        
        <div
          class="stopwatch-display"
          :class="{ 'negative': isNegative }"
          :style="{
            backgroundColor: config.background,
            color: isNegative ? config.negativeColor : config.textColor,
            fontSize: config.fontSize + 'px',
            fontFamily: config.fontFamily
          }"
        >
          <span class="stopwatch-time">{{ formattedTime }}</span>
        </div>
        
        <!-- Target reached indicator -->
        <div v-if="isTargetReached" class="target-reached">
          <v-icon color="success">mdi-check-circle</v-icon>
          {{ t('settings.targetReached') }}
        </div>
        
        <!-- Control Buttons -->
        <div class="control-buttons">
          <v-btn
            :color="isRunning ? 'warning' : 'success'"
            size="large"
            @click="toggleTimer"
            class="control-btn"
          >
            <v-icon start>{{ isRunning ? 'mdi-pause' : 'mdi-play' }}</v-icon>
            {{ isRunning ? t('settings.pause') : t('settings.start') }}
          </v-btn>
          <v-btn
            color="error"
            size="large"
            @click="resetTimer"
            class="control-btn"
          >
            <v-icon start>mdi-refresh</v-icon>
            {{ t('settings.reset') }}
          </v-btn>
          <v-btn
            color="info"
            size="large"
            @click="saveCurrentTime"
            class="control-btn"
          >
            <v-icon start>mdi-content-save</v-icon>
            {{ t('settings.save') }}
          </v-btn>
        </div>

        <!-- Toggle Saved Times List -->
        <div class="saved-times-toggle">
          <v-switch
            v-model="config.enableSavePanel"
            :label="t('settings.showSavedTimes')"
            color="primary"
            hide-details
            density="compact"
            @change="saveConfig"
          />
        </div>

        <!-- Save Times Panel -->
        <div v-if="config.enableSavePanel" class="save-panel">
          <div class="save-panel-header">
            <span class="save-panel-title">{{ t('settings.savedTimes') }}</span>
          </div>
          
          <div class="save-input-row">
            <v-text-field
              v-model="saveName"
              :label="t('settings.name')"
              density="compact"
              hide-details
              class="save-name-input"
            />
            <v-btn
              color="primary"
              size="small"
              @click="saveCurrentTime"
            >
              <v-icon start>mdi-content-save</v-icon>
              {{ t('settings.save') }}
            </v-btn>
          </div>

          <div class="saved-times-list">
            <div 
              v-for="(item, index) in savedTimes" 
              :key="index" 
              class="saved-time-item"
            >
              <div class="saved-time-info">
                <span class="saved-time-name">{{ item.name }}</span>
                <span class="saved-time-value">{{ formatSavedTime(item.time) }}</span>
              </div>
              <div class="saved-time-actions">
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  @click="loadSavedTime(item.time)"
                >
                  <v-icon>mdi-upload</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="deleteSavedTime(index)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
            <div v-if="savedTimes.length === 0" class="no-saved-times">
              {{ t('settings.noSavedTimes') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </ModuleContainer>
</template>

<script>
import ModuleContainer from "@/layout/ModuleContainer.vue";
import LScreenBtn from "@/components/buttons/Screen.vue";
import { ref } from "vue";

export default {
  name: "StopwatchInterface",
  components: {
    ModuleContainer,
    LScreenBtn,
  },
  data: () => ({
    activeTab: 'time',
    config: {
      mode: 'stopwatch',
      background: '#000000',
      textColor: '#ffffff',
      negativeColor: '#ef4444',
      currentTimeColor: '#6b7280',
      currentTimeFontSize: 18,
      fontSize: 96,
      fontFamily: 'Arial, sans-serif',
      countdownHours: 0,
      countdownMinutes: 5,
      countdownSeconds: 0,
      continueAfterZero: false,
      targetHours: 0,
      targetMinutes: 10,
      targetSeconds: 0,
      stopAtTarget: false,
      showCurrentTime: true,
      enableSavePanel: false,
      currentTime: 0,
    },
    modeOptions: [
      { label: 'Cronômetro', value: 'stopwatch' },
      { label: 'Contagem Regressiva', value: 'countdown' },
      { label: 'Contagem até valor', value: 'countup' },
    ],
    fontSizeOptions: [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 60, 72, 84, 96, 108, 120, 144, 168, 192, 200],
    fontSizeOptionsSmall:  [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 60, 72, 84, 96, 108, 120, 144, 168, 192, 200],
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
    isRunning: false,
    timer: null,
    clockTimer: null,
    startTime: 0,
    elapsedTime: 0,
    countdownTime: 0,
    currentClockTime: new Date(),
    saveName: '',
    savedTimes: [],
  }),
  computed: {
    moduleContainer() {
      return this.$refs.moduleContainer;
    },
    // Calculate target time in milliseconds for countup mode
    targetTimeMs() {
      if (this.config.mode === 'countup' && this.config.targetHours !== undefined) {
        return (this.config.targetHours * 3600000) + 
               (this.config.targetMinutes * 60000) + 
               (this.config.targetSeconds * 1000);
      }
      return 0;
    },
    // Check if target was reached in countup mode
    isTargetReached() {
      if (this.config.mode === 'countup' && this.config.targetHours !== undefined) {
        return this.config.currentTime >= this.targetTimeMs;
      }
      return false;
    },
    isNegative() {
      // Negative time (below zero in countdown)
      if (this.config.currentTime < 0) {
        return true;
      }
      // Target reached in countup mode
      if (this.isTargetReached) {
        return true;
      }
      return false;
    },
    formattedCurrentTime() {
      return this.currentClockTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    formattedTime() {
      const time = this.config.currentTime || 0;
      const absTime = Math.abs(time);
      const hours = Math.floor(absTime / 3600000);
      const minutes = Math.floor((absTime % 3600000) / 60000);
      const seconds = Math.floor((absTime % 60000) / 1000);
      
      const sign = time < 0 ? '-' : '';
      
      if (hours > 0) {
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
  },
  methods: {
    t(key) {
      return this.moduleContainer?.t(key) || key;
    },
    selectMode(value) {
      this.config.mode = value;
      this.resetTimer();
      this.saveConfig();
    },
    getModeLabel() {
      const mode = this.modeOptions.find(m => m.value === this.config.mode);
      return mode ? mode.label : 'Selecione';
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
    selectCurrentTimeColor(color) {
      this.config.currentTimeColor = color;
      this.saveConfig();
    },
    selectCurrentTimeFontSize(size) {
      this.config.currentTimeFontSize = size;
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
    toggleTimer() {
      if (this.isRunning) {
        this.pauseTimer();
      } else {
        this.startTimer();
      }
    },
    startTimer() {
      this.isRunning = true;
      
      if (this.config.mode === 'stopwatch') {
        this.startTime = Date.now() - this.elapsedTime;
        this.timer = setInterval(() => {
          this.elapsedTime = Date.now() - this.startTime;
          this.config.currentTime = this.elapsedTime;
          this.saveConfig();
        }, 100);
      } else if (this.config.mode === 'countup') {
        // Count up to target
        this.startTime = Date.now() - this.elapsedTime;
        const targetMs = (this.config.targetHours * 3600000) + 
                        (this.config.targetMinutes * 60000) + 
                        (this.config.targetSeconds * 1000);
        
        this.timer = setInterval(() => {
          this.elapsedTime = Date.now() - this.startTime;
          this.config.currentTime = this.elapsedTime;
          this.saveConfig();
          
          if (this.elapsedTime >= targetMs && this.config.stopAtTarget) {
            this.config.currentTime = targetMs;
            this.pauseTimer();
          }
        }, 100);
      } else if (this.config.mode === 'countdown') {
        // Countdown mode
        if (this.countdownTime === 0) {
          this.countdownTime = (this.config.countdownHours * 3600000) + 
                               (this.config.countdownMinutes * 60000) + 
                               (this.config.countdownSeconds * 1000);
        }
        this.startTime = Date.now();
        const endTime = this.startTime + this.countdownTime;
        
        this.timer = setInterval(() => {
          const remaining = endTime - Date.now();
          
          if (remaining <= 0) {
            if (this.config.continueAfterZero) {
              // Continue to negative
              this.config.currentTime = remaining;
              this.countdownTime = remaining;
            } else {
              // Stop at 0
              this.config.currentTime = 0;
              this.countdownTime = 0;
              this.pauseTimer();
            }
          } else {
            this.config.currentTime = remaining;
            this.countdownTime = remaining;
          }
          this.saveConfig();
        }, 100);
      }
    },
    pauseTimer() {
      this.isRunning = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if (this.config.mode === 'stopwatch' || this.config.mode === 'countup') {
        this.elapsedTime = this.config.currentTime;
      }
    },
    resetTimer() {
      this.pauseTimer();
      this.elapsedTime = 0;
      this.countdownTime = 0;
      
      if (this.config.mode === 'stopwatch') {
        this.config.currentTime = 0;
      } else if (this.config.mode === 'countup') {
        this.config.currentTime = 0;
      } else {
        this.config.currentTime = (this.config.countdownHours * 3600000) + 
                                  (this.config.countdownMinutes * 60000) + 
                                  (this.config.countdownSeconds * 1000);
      }
      this.saveConfig();
    },
    saveConfig() {
      try {
        this.$appdata.set(`modules.stopwatch.config`, JSON.parse(JSON.stringify(this.config)));
      } catch (e) {
        console.error('Error saving config:', e);
      }
    },
    loadConfig() {
      try {
        const savedConfig = this.$appdata.get(`modules.stopwatch.config`);
        if (savedConfig) {
          this.config = { ...this.config, ...savedConfig };
        }
        const savedTimesData = this.$appdata.get(`modules.stopwatch.savedTimes`);
        if (savedTimesData) {
          this.savedTimes = savedTimesData;
        }
      } catch (e) {
        console.error('Error loading config:', e);
      }
    },
    saveCurrentTime() {
      if (!this.saveName.trim()) {
        this.saveName = 'Tempo ' + (this.savedTimes.length + 1);
      }
      this.savedTimes.push({
        name: this.saveName,
        time: this.config.currentTime
      });
      this.saveName = '';
      this.saveSavedTimes();
    },
    loadSavedTime(time) {
      this.pauseTimer();
      this.config.currentTime = time;
      this.elapsedTime = time;
      this.saveConfig();
    },
    deleteSavedTime(index) {
      this.savedTimes.splice(index, 1);
      this.saveSavedTimes();
    },
    formatSavedTime(time) {
      const absTime = Math.abs(time);
      const hours = Math.floor(absTime / 3600000);
      const minutes = Math.floor((absTime % 3600000) / 60000);
      const seconds = Math.floor((absTime % 60000) / 1000);
      
      const sign = time < 0 ? '-' : '';
      
      if (hours > 0) {
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    saveSavedTimes() {
      try {
        this.$appdata.set(`modules.stopwatch.savedTimes`, JSON.parse(JSON.stringify(this.savedTimes)));
      } catch (e) {
        console.error('Error saving times:', e);
      }
    },
  },
  watch: {},
  mounted() {
    setTimeout(() => {
      this.loadConfig();
    }, 500);
    
    // Update current time every second
    this.clockTimer = setInterval(() => {
      this.currentClockTime = new Date();
    }, 1000);
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  },
};
</script>

<style scoped>
.stopwatch-config-container {
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

.settings-tabs {
  margin-bottom: 20px;
}

.tab-content {
  margin-bottom: 20px;
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

.stopwatch-display {
  height: 200px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 96px;
  font-weight: 600;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.stopwatch-display.negative {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.current-time-display {
  background: #f3f4f6;
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 16px;
  font-weight: 500;
}

.target-reached {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #dcfce7;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  color: #16a34a;
  margin-bottom: 16px;
}

.time-inputs {
  display: flex;
  gap: 12px;
}

.time-input-group {
  flex: 1;
  text-align: center;
}

.time-input-group label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.time-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
}

.time-input:focus {
  outline: none;
  border-color: #2563eb;
}

.control-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.control-btn {
  min-width: 140px;
}

.projection-btn {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

/* Saved Times Toggle */
.saved-times-toggle {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

/* Save Panel Styles */
.save-panel {
  margin-top: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.save-panel-header {
  background: #f3f4f6;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.save-panel-title {
  font-weight: 600;
  color: #1f2937;
}

.save-input-row {
  display: flex;
  gap: 12px;
  padding: 16px;
  align-items: center;
}

.save-name-input {
  flex: 1;
}

.saved-times-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
}

.saved-time-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  background: #f9fafb;
}

.saved-time-item:hover {
  background: #f3f4f6;
}

.saved-time-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.saved-time-name {
  font-weight: 500;
  color: #1f2937;
}

.saved-time-value {
  font-family: monospace;
  color: #6b7280;
  font-size: 14px;
}

.saved-time-actions {
  display: flex;
  gap: 4px;
}

.no-saved-times {
  text-align: center;
  color: #9ca3af;
  padding: 20px;
  font-style: italic;
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

