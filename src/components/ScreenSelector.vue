<template>
  <v-dialog v-model="show" max-width="500">
    <template v-slot:activator="{ props }">
      <v-tooltip :text="$t('components.screen_selector.tooltip')">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            v-bind="{ ...props, ...tooltipProps }"
            icon="mdi-monitor-multiple"
          />
        </template>
      </v-tooltip>
    </template>

    <v-card>
      <v-card-title class="d-flex align-center">
        {{ $t("components.screen_selector.title") }}
        <v-spacer />
        <v-btn
          icon="mdi-refresh"
          variant="text"
          density="compact"
          :loading="loading"
          @click="detect"
        />
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-4">
          {{ $t("components.screen_selector.description") }}
        </p>

        <v-alert
          v-if="!supported"
          type="warning"
          variant="tonal"
          density="compact"
          :text="$t('components.screen_selector.not_supported')"
        />
        <v-alert
          v-else-if="!loading && screens.length <= 1"
          type="info"
          variant="tonal"
          density="compact"
          :text="$t('components.screen_selector.only_one_screen')"
        />

        <v-list v-if="screens.length > 0" class="mt-2">
          <v-list-item
            v-for="scr in screens"
            :key="scr.key"
            :active="isSelected(scr)"
            @click="select(scr)"
          >
            <template v-slot:prepend>
              <v-icon
                :icon="
                  scr.isPrimary ? 'mdi-monitor-star' : 'mdi-monitor-screenshot'
                "
              />
            </template>
            <v-list-item-title>
              {{ $t("components.screen_selector.screen") }} {{ scr.label }}
              <v-chip v-if="scr.isPrimary" size="x-small" class="ms-2">
                {{ $t("components.screen_selector.primary_screen") }}
              </v-chip>
              <v-chip v-if="scr.isCurrent" size="x-small" class="ms-2">
                {{ $t("components.screen_selector.current_screen") }}
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ scr.width }} x {{ scr.height }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-icon v-if="isSelected(scr)" icon="mdi-check-circle" color="success" />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="show = false">{{ $t("alert.close") }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import $screen from "@/helpers/Screen";

export default {
  name: "ScreenSelectorComponent",
  data: () => ({
    show: false,
    loading: false,
    supported: true,
    screens: [],
  }),
  computed: {
    selected() {
      return this.$userdata.get("projection_screen");
    },
  },
  watch: {
    show(value) {
      if (value) {
        this.detect();
      }
    },
  },
  methods: {
    isSelected(scr) {
      return (
        this.selected &&
        this.selected.left === scr.left &&
        this.selected.top === scr.top
      );
    },
    async detect() {
      this.supported = $screen.isSupported();
      if (!this.supported) {
        this.screens = [];
        return;
      }
      this.loading = true;
      this.screens = await $screen.listScreens();
      this.loading = false;
    },
    select(scr) {
      $screen.saveSelectedScreen(scr);
    },
  },
};
</script>
