<template>
  <div class="d-flex align-center justify-end pa-1 flex-grow-1">
    <v-menu v-if="location !== 'fullscreen' && display.width.value > 350">
      <template #activator="{ props }">
        <v-btn
          variant="text"
          size="small"
          :color="mode.color"
          v-bind="props"
          :icon="mode.tray_icon"
        />
      </template>

      <v-list>
        <template v-for="(item, key) in menuModes" :key="key">
          <v-divider v-if="item.title == '-'" />
          <v-list-item v-else :active="item.active" :disabled="item.disabled" @click="item.click">
            <template #prepend>
              <v-icon :icon="item.icon"></v-icon>
            </template>
            {{ item.title }}
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

    <v-menu v-if="minimized && !compact">
      <template #activator="{ props }">
        <v-btn variant="flat" size="x-small" color="white" v-bind="props">
          {{ slideIndex + 1 }}
        </v-btn>
      </template>

      <v-list>
        <v-list-item
          v-for="(item, index) in slides"
          :key="index"
          :active="slideIndex == index"
          @click="$emit('go-to-slide', index)"
        >
          <template #prepend>
            <v-chip size="small" class="mr-2">{{ index + 1 }}</v-chip>
          </template>

          <v-list-item-title v-if="item.cover">
            {{ item.lyric }}
          </v-list-item-title>
          <div v-else class="text-caption text-truncate" v-html="item.lyric" />
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn
      v-if="minimized"
      variant="text"
      size="small"
      icon="mdi-open-in-app"
      @click="$emit('maximize')"
    />
    <v-btn
      v-if="location == 'fullscreen'"
      variant="text"
      size="small"
      icon="mdi-fullscreen-exit"
      @click="$emit('fullscreen', false)"
    />
    <v-btn
      v-else-if="location == 'window'"
      variant="text"
      size="small"
      icon="mdi-fullscreen"
      @click="$emit('fullscreen', true)"
    />
    <LScreenBtn v-if="location !== 'fullscreen'" module="media" />

    <v-menu v-if="location !== 'fullscreen' && compact">
      <template #activator="{ props }">
        <v-btn icon="mdi-menu" variant="text" size="small" v-bind="props"></v-btn>
      </template>

      <v-list>
        <v-list-item
          v-for="(button, key) in compactButtons"
          :key="key"
          :disabled="loading || button.disabled"
          @click="button.click"
        >
          <v-icon :icon="button.icon" />
        </v-list-item>

        <v-divider v-if="display.width.value <= 350" />
        <template v-for="(item, key) in menuModes" :key="key">
          <v-divider v-if="item.title == '-' && display.width.value <= 350" />
          <v-list-item
            v-else-if="display.width.value <= 350"
            :active="item.active"
            :disabled="item.disabled"
            @click="item.click"
          >
            <v-icon :icon="item.icon" />
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

    <v-btn v-if="minimized" variant="text" size="small" icon="mdi-close" @click="$emit('close')" />
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";
import LScreenBtn from "@/components/buttons/Screen.vue";

defineProps({
  location: { type: String, default: "" },
  minimized: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  slideIndex: { type: Number, default: 0 },
  mode: { type: Object, default: () => ({}) },
  menuModes: { type: Array, default: () => [] },
  slides: { type: Array, default: () => [] },
  compactButtons: { type: Array, default: () => [] },
});

defineEmits(["go-to-slide", "maximize", "fullscreen", "close"]);

const display = useDisplay();
</script>
