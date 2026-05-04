<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn v-bind="props" slim>
        <country-flag
          v-if="current_language"
          :country="languages[current_language].flag"
          style="margin: 0; padding: 0"
        />
      </v-btn>
    </template>
    <v-list>
      <v-list-item v-for="(language, key) in languages" :key="key" @click="changeLanguage(key)">
        <template #prepend>
          <country-flag :country="language.flag" style="margin: 0; padding: 0" />
        </template>
        <v-list-item-title>
          {{ language.name }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import CountryFlag from "vue-country-flag-next";
import AppData from "@/helpers/AppData";
import UserData from "@/helpers/UserData";

export default {
  name: "LanguageSelectorComponent",
  components: {
    CountryFlag,
  },
  computed: {
    languages() {
      return AppData.get("languages");
    },
    current_language() {
      return UserData.get("language");
    },
  },
  methods: {
    changeLanguage(language) {
      this.$i18n.locale = language;
      UserData.set("language", language);
    },
  },
};
</script>
