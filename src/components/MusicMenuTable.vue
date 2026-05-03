<template>
  <div class="mmt">
    <template v-if="!compact">
      <button
        v-for="(btn, key) in buttons"
        :key="key"
        type="button"
        class="mmt-btn"
        :class="{
          'mmt-btn--disabled': btn.disabled,
          'mmt-btn--star': btn.icon === 'mdi-star',
        }"
        :disabled="!!btn.disabled"
        :title="btn.title"
        @click="btn.click"
      >
        <v-icon :icon="btn.icon" size="16" />
      </button>
    </template>

    <v-menu location="start">
      <template #activator="{ props }">
        <button
          type="button"
          class="mmt-btn mmt-btn--menu"
          :title="$t('shell.appmenu')"
          v-bind="props"
        >
          <v-icon icon="mdi-menu" size="16" />
        </button>
      </template>

      <v-list>
        <v-list-item v-if="compact" class="d-flex justify-center">
          <v-btn
            v-for="(btn, key) in buttons"
            :key="key"
            :disabled="btn.disabled ? btn.disabled : false"
            variant="text"
            :color="$theme.primary()"
            :icon="btn.icon"
            density="compact"
            class="mx-1"
            @click="btn.click"
          />
        </v-list-item>
        <v-divider v-if="compact" />

        <v-list-item v-for="(item, key) in menu" :key="key" class="cursor-pointer">
          <template #prepend>
            <v-icon :icon="item.icon"></v-icon>
          </template>
          <template #append>
            <v-icon icon="mdi-menu-right" size="x-small"></v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>

          <v-menu :open-on-focus="false" activator="parent" :open-on-hover="!is_mobile" submenu>
            <v-list>
              <template v-for="(subitem, subkey) in item.menu" :key="subkey">
                <v-divider v-if="subitem.title == '-'" />
                <v-list-item
                  v-else
                  :prepend-icon="subitem.icon"
                  :title="subitem.title"
                  :disabled="subitem.disabled ? subitem.disabled : false"
                  @click="subitem.click"
                />
              </template>
            </v-list>
          </v-menu>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: "MusicMenuTableComponent",
  props: {
    id_music: Number,
    name: String,
    has_instrumental_music: [Boolean, Number],
    color: String,
    extraMenu: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    is_favorite() {
      return this.$favorites.isFavorite(this.id_music);
    },
    buttons() {
      return [
        {
          disabled: false,
          title: this.is_favorite
            ? this.$t("components.music_menu.remove_from_favorites")
            : this.$t("components.music_menu.add_to_favorites"),
          icon: this.is_favorite ? "mdi-star" : "mdi-star-outline",
          click: () =>
            this.$favorites.toggle(this.id_music, this.name, this.has_instrumental_music),
        },
        {
          disabled: false,
          title: this.$t("ribbon.btn.sing"),
          icon: "mdi-play-box-multiple",
          click: () => this.$media.open({ id_music: this.id_music, mode: "audio" }),
        },
        {
          disabled: !this.has_instrumental_music,
          title: this.$t("ribbon.btn.playback"),
          icon: "mdi-play-box-multiple-outline",
          click: () => this.$media.open({ id_music: this.id_music, mode: "instrumental" }),
        },
        {
          disabled: false,
          title: this.$t("ribbon.btn.no_audio"),
          icon: "mdi-checkbox-multiple-blank-outline",
          click: () => this.$media.open(this.id_music),
        },
        {
          disabled: false,
          title: this.$t("ribbon.btn.lyric"),
          icon: "mdi-text-box-outline",
          click: () => this.$media.openLyric(this.id_music),
        },
      ];
    },
    menu() {
      return [
        {
          title: this.$t("components.music_menu.add_to"),
          icon: "mdi-plus",
          menu: [
            {
              title: this.is_favorite
                ? this.$t("components.music_menu.remove_from_favorites")
                : this.$t("components.music_menu.add_to_favorites"),
              icon: this.is_favorite ? "mdi-star-off" : "mdi-star",
              click: () =>
                this.$favorites.toggle(this.id_music, this.name, this.has_instrumental_music),
            },
            {
              title: this.$t("components.music_menu.add_to_liturgy"),
              icon: "mdi-view-list-outline",
              click: () =>
                this.$liturgy.addMusic(this.id_music, this.name, this.has_instrumental_music),
            },
          ],
        },
        {
          title: this.$t("components.music_menu.execute"),
          icon: "mdi-play",
          menu: [
            {
              title: this.$t("ribbon.btn.sing"),
              icon: "mdi-play-box-multiple",
              click: () => this.$media.open({ id_music: this.id_music, mode: "audio" }),
            },
            {
              title: this.$t("ribbon.btn.playback"),
              icon: "mdi-play-box-multiple-outline",
              click: () =>
                this.$media.open({
                  id_music: this.id_music,
                  mode: "instrumental",
                }),
              disabled: !this.has_instrumental_music,
            },
            {
              title: this.$t("ribbon.btn.no_audio"),
              icon: "mdi-checkbox-multiple-blank-outline",
              click: () => this.$media.open(this.id_music),
            },
            {
              title: this.$t("ribbon.btn.lyric"),
              icon: "mdi-text-box-outline",
              click: () => this.$media.openLyric(this.id_music),
            },
            {
              title: "-",
            },
            {
              title: this.$t("components.music_menu.file_sing"),
              icon: "mdi-file-music",
              click: () => this.$media.openAudio(this.id_music),
            },
            {
              title: this.$t("components.music_menu.file_playback"),
              icon: "mdi-file-music-outline",
              click: () =>
                this.$media.openAudio({
                  id_music: this.id_music,
                  mode: "instrumental",
                }),
              disabled: !this.has_instrumental_music,
            },
          ],
        },
        ...this.extraMenu.map((item) => ({
          title: item.title,
          icon: item.icon,
          menu: [{ title: item.title, icon: item.icon, click: item.click }],
        })),
      ];
    },
    compact: function () {
      return this.$vuetify.display.width <= 550;
    },
    is_mobile: function () {
      return this.$appdata.get("is_mobile");
    },
  },
};
</script>

<style scoped>
.mmt {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: nowrap;
}

.mmt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--lj-radius-sm);
  color: var(--lj-text-muted);
  cursor: pointer;
  transition:
    background var(--lj-transition-fast),
    color var(--lj-transition-fast),
    border-color var(--lj-transition-fast);
  font-family: inherit;
  flex-shrink: 0;
}

.mmt-btn:hover:not(:disabled) {
  background: var(--lj-active-bg);
  color: var(--lj-navy);
  border-color: var(--lj-navy);
}

.mmt-btn--disabled,
.mmt-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.mmt-btn--star {
  color: var(--lj-color-cover-gold);
}

.mmt-btn--star:hover:not(:disabled) {
  color: var(--lj-orange-darker);
  background: var(--lj-orange-alpha-12);
  border-color: var(--lj-orange);
}

.mmt-btn--menu {
  color: var(--lj-text-muted);
}
</style>
